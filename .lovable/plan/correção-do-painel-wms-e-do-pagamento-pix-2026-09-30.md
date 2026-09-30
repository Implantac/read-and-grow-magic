# Correção do painel WMS e do pagamento PIX

## Objetivo
Restabelecer o painel WMS com indicadores derivados apenas de dados reais e tornar o pagamento PIX seguro, sem QR Code ou confirmação fictícios.

## Implementação

### 1. Painel WMS
- Substituir números e recomendações fixas do painel por métricas calculadas das operações reais.
- Tratar falhas individuais das consultas, exibindo erro acionável sem transformar falha em valor zero.
- Atualizar o painel quando houver mudanças nas tabelas operacionais relevantes e oferecer atualização manual.
- Corrigir a leitura de capacidade/ocupação e eliminar o uso de endereço com baixa ocupação como falso indicador de estoque baixo.
- Preservar as rotas e telas operacionais existentes, sem criar um WMS paralelo.

### 2. Pagamento PIX no PDV
- Remover o QR visual e o código copia-e-cola fabricados no navegador.
- Criar a cobrança pela integração financeira existente e exibir somente QR/copia-e-cola retornados pelo serviço.
- Manter o pagamento pendente até confirmação real recebida pelo webhook; retirar a confirmação manual de recebimento.
- Cancelar/remover a divisão PIX do PDV quando a cobrança falhar ou for cancelada.
- Quando o provedor PIX não estiver configurado, bloquear a cobrança com mensagem clara e sem persistir pagamento fictício.

### 3. Validação
- Adicionar testes dos estados de carregamento, erro, cobrança pendente e cobrança paga.
- Executar os testes do projeto e validar visualmente o painel WMS e o diálogo PIX antes dos testes navegados completos.

## Limites
- Não será simulado recebimento bancário em produção.
- A liquidação continuará dependendo da confirmação assinada do provedor PIX.
- Se não houver provedor/credenciais configurados, o fluxo ficará indisponível de forma segura, não falsamente concluído.
