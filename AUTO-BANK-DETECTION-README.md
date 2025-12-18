# 🏦 Detecção Automática de Transações Bancárias - README Rápido

## ✨ O que faz?

O app agora detecta **automaticamente** transações do Nubank (e outros bancos) e adiciona no seu controle financeiro!

### Transações detectadas:
- ✅ Pix enviado/recebido
- ✅ Compras com cartão (crédito/débito)
- ✅ Transferências bancárias

## 🚀 Como Ativar (3 passos simples)

### **1. Build do app**
```bash
npm run build:prd && npx cap sync android
```

### **2. Conceda Permissão**
No Android:
1. Vá em **Configurações > Notificações > Acesso a notificações**
2. Ative **"Financial Control"**
3. Volte ao app

### **3. Pronto!**
O app já inicia automaticamente a detecção quando você abre!

## 📱 Como Testar

1. Abra o app
2. Veja o console: `✅ Detecção de transações bancárias ATIVADA!`
3. Envie um **Pix** pelo Nubank
4. Receba notificação: **"🏦 Transação Detectada! Pix para João - R$ 50,00"**
5. A transação já está adicionada automaticamente! ✨

## 📊 Logs no Console

Todas as notificações aparecem no console:

```
🏦 Inicializando detector de transações bancárias...
✅ Detecção de transações bancárias ATIVADA!
📲 Notificação externa recebida: {app: "Nubank", title: "Pix enviado", ...}
🔍 Processando notificação: ...
💰 Transação detectada: {type: "expense", amount: 50.00, ...}
✅ Transação adicionada
```

## ⚠️ Sem Permissão?

Se ver esta mensagem no console:
```
⚠️ Sem permissão para escutar notificações.
💡 Para ativar:
1. Abra as Configurações do Android
2. Vá em: Notificações > Acesso a notificações
3. Ative "Financial Control"
4. Reabra o app
```

Siga os passos e reabra o app!

## 🎯 Bancos Suportados

- ✅ **Nubank** (totalmente suportado)
- ⚠️ Outros bancos (Inter, Itaú, Bradesco, etc) - detecta como app bancário, mas pode precisar ajustar padrões

## 🔧 Personalizar

Para adicionar novos padrões de detecção, edite:
`src/services/bank-transaction-detector.service.ts`

## 📚 Guia Completo

Veja `BANK-TRANSACTION-DETECTOR-GUIDE.md` para:
- Detalhes técnicos
- Personalização avançada
- Troubleshooting
- Como adicionar novos bancos

## ✅ Checklist Final

- [x] Plugin nativo Android criado
- [x] Serviço de detecção implementado
- [x] Integração com TransactionService
- [x] Notificações automáticas
- [x] Logs detalhados
- [x] Inicialização automática no app
- [x] Página de teste removida (apenas logs)

## 🎉 Pronto!

Agora seu app detecta transações bancárias automaticamente!

**Build, conceda permissão e teste! 🚀**
