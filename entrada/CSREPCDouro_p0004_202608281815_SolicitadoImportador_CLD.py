#!/usr/bin/env python3
"""
p0004 — o conversor da Gestão PCO grava o instante da solicitação
CSREPC Douro · Estação PEA · sem alteração à versão de estado

Depende de p0003, que criou o campo `solicitado` em O.pco.funcoes.

Achado: converterGestaoPCO() já lê `n.solicitado` dos nucleos_externos do contrato
e produz com ele avisos úteis — "solicitado a X e ainda por nomear", "3.2 h entre a
solicitação e a nomeação" — mas não o grava no registo. Um núcleo que venha de raiz
no pacote entra sem instante de solicitação, e a regra `nomext` e a pendência de
Comando não o veem. A fusão de aplicarGestaoPCO() já preserva o campo quando ele
existe; falta o caso em que a função nasce da importação.

Duas linhas. Toca em converterGestaoPCO(), que é território do importador — se
preferires escrevê-la aí, o efeito é o mesmo e este patch fica sem uso.

  F1  nucleos_externos: grava `solicitado` a partir do instante já lido.
  F2  funcoes: declara `solicitado:""`, para que o registo tenha sempre a forma
      completa e a fusão não dependa de o campo existir do outro lado.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "r0029b.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "r0030.html"

s = io.open(SRC, encoding="utf-8").read()
N = [0]

def troca(ancora, novo, nome):
    global s
    c = s.count(ancora)
    assert c == 1, "[%s] ancora encontrada %d vezes, esperava 1:\n%s" % (nome, c, ancora[:200])
    s = s.replace(ancora, novo, 1)
    N[0] += 1
    print("  ok  " + nome)

troca(
    '''    funcoes.push({ f:nome, nome:String(n.responsavel||""), entidade:String(n.entidade_nomeadora||""),
      ct:String(n.contacto||""), siresp:"", ba:"", g: nomeado? gdhDe(nomeado):"" });''',
    '''    /* Os dois instantes dos arts. 23.º, n.º 2, 24.º, n.º 2 e 25.º, n.º 2 gravam-se
       ambos: `solicitado` é o pedido do COS, `g` a nomeação pela entidade. Já eram
       lidos acima para compor os avisos; sem os gravar, um núcleo que nasça da
       importação entra sem o pedido e a pendência não o vê. */
    funcoes.push({ f:nome, nome:String(n.responsavel||""), entidade:String(n.entidade_nomeadora||""),
      ct:String(n.contacto||""), siresp:"", ba:"",
      solicitado: pedido? gdhDe(pedido):"", g: nomeado? gdhDe(nomeado):"" });''',
    "F1 nucleos_externos gravam o instante da solicitação"
)

troca(
    '''    funcoes.push({ f:nome, nome:String(f.nome||""), entidade:String(f.entidade||""),
      ct:String(f.contacto||""), siresp:String(f.siresp||""), ba:String(f.ba||""),
      g: gdhDeISO(f.nomeado) });''',
    '''    funcoes.push({ f:nome, nome:String(f.nome||""), entidade:String(f.entidade||""),
      ct:String(f.contacto||""), siresp:String(f.siresp||""), ba:String(f.ba||""),
      solicitado:"", g: gdhDeISO(f.nomeado) });''',
    "F2 funções internas declaram o campo vazio"
)


# -- F3/F4/F5 - a entidade concreta antes da parafrase da lei -----------
#
#     A regra, a pendencia e a fita preferiam pcoDef(f).ext, que e a designacao
#     doutrinaria generica: "forca de seguranca territorialmente competente".
#     O contrato traz a entidade concreta contactada - GNR, PSP. Numa pendencia
#     de passagem de turno serve o nome de quem se liga; a designacao da lei
#     fica como recurso para quando a concreta nao vier.
troca(
    'return f.f+" — solicitado a "+(pcoDef(f.f).ext||f.entidade||"entidade competente")+" em "+f.solicitado',
    'return f.f+" — solicitado a "+(f.entidade||pcoDef(f.f).ext||"entidade competente")+" em "+f.solicitado',
    "F3 regra nomext nomeia a entidade concreta"
)
troca(
    'pend.map(x=>x.f+" a "+(pcoDef(x.f).ext||x.entidade||"entidade")+", solicitada "+x.solicitado), true);',
    'pend.map(x=>x.f+" a "+(x.entidade||pcoDef(x.f).ext||"entidade")+", solicitada "+x.solicitado), true);',
    "F4 pendencia de Comando nomeia a entidade concreta"
)
troca(
    '"Solicitação de nomeação: "+f+" a "+(pcoDef(f).ext||reg.entidade||"entidade competente")',
    '"Solicitação de nomeação: "+f+" a "+(reg.entidade||pcoDef(f).ext||"entidade competente")',
    "F5 fita nomeia a entidade concreta"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s" % (N[0], DST))
