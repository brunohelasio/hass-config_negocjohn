#!/usr/bin/perl
# Verifica TODOS os !include do dashboard e acusa alvos inexistentes.
#
# Criado depois do incidente de 2026-08-03: um arquivo era incluido por caminho
# ABSOLUTO (/config/dashboards/floorplan/), o resolvedor anterior nao seguia esse
# formato, e as dependencias DELE viraram falsos orfaos — foram arquivadas e o
# Home Assistant passou a falhar ao carregar o dashboard.
#
# Duas varreduras independentes:
#   1) grafo — parte do entrypoint e segue os includes ativos;
#   2) exaustiva — le TODO yaml em dashboards/ e confere cada alvo.
#
# A segunda pega o que a primeira nao alcanca: includes dentro de arquivos que
# so entram no grafo por caminho absoluto ou por !include_dir.
#
# Uso:  perl scripts/validation/check-includes.pl [raiz-do-repo]
# Saida: 0 = tudo resolve; 1 = ha include quebrado.

use strict; use warnings;
use File::Basename qw(dirname);
use File::Spec;

my $repo = shift @ARGV || '.';
my $CONFIG = "$repo/config";
my $ENTRY  = "$CONFIG/dashboards/ui-lovelace-main.yaml";

sub norm {
  my $p = shift; $p =~ s{\\}{/}g; $p =~ s{/+}{/}g;
  while ($p =~ s{/[^/]+/\.\./}{/}) {} $p =~ s{/\./}{/}g; return $p;
}

# Extrai os alvos de include de um arquivo, ignorando linhas comentadas.
sub targets_of {
  my $f = shift; my @out;
  open(my $fh, '<:raw', $f) or return @out;
  my $dir = dirname($f);
  while (my $line = <$fh>) {
    next if $line =~ /^\s*#/;
    while ($line =~ /!include(_dir_merge_named|_dir_merge_list|_dir_list|_dir_named)?\s+(\S+)/g) {
      my ($mode, $t) = ($1 // '', $2);
      $t =~ s/["']//g; $t =~ s/\s+$//;
      # O HA resolve `/config/...` para o diretorio de configuracao. Depois da
      # troca o caminho ja esta completo — nao pode ser rejuntado com $dir,
      # mesmo quando a raiz passada e relativa (foi esse o bug de 2026-08-03).
      my $resolved;
      if ($t =~ m{^/config/(.*)$}) { $resolved = "$CONFIG/$1" }
      elsif (File::Spec->file_name_is_absolute($t)) { $resolved = $t }
      else { $resolved = "$dir/$t" }
      my $abs = norm($resolved);
      push @out, { path => $abs, dir => ($mode ne ''), src => $f, raw => $t };
    }
  }
  close($fh);
  return @out;
}

my (%seen, @broken);

# --- Varredura 1: a partir do entrypoint ---------------------------------
my @queue = ($ENTRY);
unless (-e $ENTRY) { print "FALHA: entrypoint ausente: $ENTRY\n"; exit 1 }
while (my $f = shift @queue) {
  $f = norm($f); next if $seen{$f}++; next unless -f $f;
  for my $t (targets_of($f)) {
    if ($t->{dir}) {
      unless (-d $t->{path}) { push @broken, $t; next }
      opendir(my $dh, $t->{path});
      push @queue, map { "$t->{path}/$_" } sort grep { /\.ya?ml$/ } readdir($dh);
      closedir($dh);
    } else {
      unless (-e $t->{path}) { push @broken, $t; next }
      push @queue, $t->{path};
    }
  }
}
my $reachable = scalar grep { -f $_ } keys %seen;

# --- Varredura 2: exaustiva sobre dashboards/ ----------------------------
my @all;
sub walk { my $d = shift; opendir(my $h, $d) or return;
  for my $e (sort readdir($h)) { next if $e =~ /^\.\.?$/;
    my $p = "$d/$e"; if (-d $p) { walk($p) } elsif ($e =~ /\.ya?ml$/) { push @all, $p } }
  closedir($h); }
walk("$CONFIG/dashboards");

my %seen_broken;
$seen_broken{"$_->{src}|$_->{raw}"} = 1 for @broken;
for my $f (@all) {
  for my $t (targets_of($f)) {
    my $key = "$t->{src}|$t->{raw}";
    next if $seen_broken{$key}++;
    my $ok = $t->{dir} ? (-d $t->{path}) : (-e $t->{path});
    push @broken, $t unless $ok;
  }
}

# --- Relatorio ------------------------------------------------------------
printf("Arquivos YAML em dashboards/ : %d\n", scalar @all);
printf("Alcancaveis pelo entrypoint  : %d\n", $reachable);
printf("Includes quebrados           : %d\n", scalar @broken);

if (@broken) {
  print "\nINCLUDES SEM ALVO:\n";
  for my $b (sort { $a->{src} cmp $b->{src} } @broken) {
    my ($s, $p) = ($b->{src}, $b->{path});
    s{^\Q$repo\E/?}{} for ($s, $p);
    printf("  %s\n      -> %s\n", $s, $p);
  }
  exit 1;
}
print "\nOK — todo include resolve.\n";
exit 0;
