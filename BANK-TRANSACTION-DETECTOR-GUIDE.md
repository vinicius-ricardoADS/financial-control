# 🏦 Guia: Detector Automático de Transações Bancárias

## 🎯 O que foi implementado

Sistema completo de **detecção automática de transações bancárias** através de notificações do Nubank e outros apps bancários!

### ✅ Funcionalidades:

1. **Captura de Notificações** - Plugin nativo Android que escuta notificações de apps bancários
2. **Detecção Inteligente** - Identifica Pix enviados/recebidos, compras, transferências
3. **Adição Automática** - Adiciona transações automaticamente no app
4. **Notificações** - Alerta quando uma transação é detectada e adicionada
5. **Logs Detalhados** - Todas as notificações aparecem no console para debug

---

## 🚀 Como Usar

### **Passo 1: Build e Deploy**

```bash
# Build do projeto
npm run build:prd

# Sincronizar com Android
npx cap sync android
```

### **Passo 2: Conceder Permissão**

Para capturar notificações de outros apps, é necessário dar permissão especial:

1. Abra o app no Android
2. No console, você verá logs pedindo para ativar permissões
3. Ou adicione código para solicitar permissão (veja abaixo)

**Código para solicitar permissão:**

```typescript
// Em qualquer component (ex: DashboardPage)
constructor(private notificationService: NotificationService) {}

async ngOnInit() {
  // Verificar permissão
  const hasPermission = await this.notificationService.hasExternalNotificationPermission();

  if (!hasPermission) {
    // Abre configurações do Android
    await this.notificationService.requestExternalNotificationPermission();
  } else {
    // Iniciar detecção
    await this.startBankDetection();
  }
}

async startBankDetection() {
  const started = await this.notificationService.startExternalNotificationListener();
  if (started) {
    console.log('✅ Detecção de transações bancárias iniciada!');
  }
}
```

### **Passo 3: Ativar nas Configurações do Android**

1. Quando solicitar permissão, você será levado para:
   **Configurações > Notificações > Acesso a notificações**

2. Procure **"Financial Control"** na lista

3. Ative o toggle

4. Volte ao app

### **Passo 4: Iniciar Detecção**

Adicione um botão para iniciar a detecção. Exemplo:

```html
<!-- dashboard.page.html -->
<ion-button (click)="toggleBankDetection()">
  <ion-icon [name]="isDetecting ? 'stop' : 'play'" slot="start"></ion-icon>
  {{ isDetecting ? 'Parar' : 'Iniciar' }} Detecção Bancária
</ion-button>
```

```typescript
// dashboard.page.ts
isDetecting = false;

async toggleBankDetection() {
  if (this.isDetecting) {
    await this.notificationService.stopExternalNotificationListener();
    this.isDetecting = false;
  } else {
    const started = await this.notificationService.startExternalNotificationListener();
    if (started) {
      this.isDetecting = true;
      console.log('🏦 Detecção bancária ativada!');
    }
  }
}
```

### **Passo 5: Testar!**

1. **Envie um Pix** pelo Nubank
2. **Receba um Pix**
3. **Faça uma compra** com cartão

Você verá nos logs:

```
📲 Notificação externa recebida: {app: "Nubank", title: "Pix enviado", ...}
🔍 Processando notificação: ...
💰 Transação detectada: {type: "expense", amount: 50.00, ...}
➕ Adicionando transação detectada: ...
✅ Transação adicionada: ...
🔔 Notificação enviada: "Transação detectada e adicionada!"
```

E receberá uma notificação:
**"🏦 Transação Detectada! Pix para João - R$ 50,00 detectado no Nubank e adicionado automaticamente!"**

---

## 📊 Transações Detectadas

### **Nubank:**

✅ **Pix Enviado** - `"Pix enviado para João R$ 50,00"`
✅ **Pix Recebido** - `"Pix recebido de Maria R$ 100,00"`
✅ **Compra Crédito** - `"Compra aprovada em IFOOD R$ 35,50"`
✅ **Compra Débito** - `"Compra no débito em UBER R$ 20,00"`
✅ **Transferência Enviada** - `"Transferência enviada R$ 200,00"`
✅ **Transferência Recebida** - `"Transferência recebida R$ 150,00"`

### **Outros Bancos:**

O sistema detecta apps bancários baseado no package name:
- `com.nu.production` - Nubank
- `nubank`
- `inter` - Banco Inter
- `bradesco`
- `itau`
- `santander`
- `caixa`
- `bb` - Banco do Brasil

---

## 🧠 Detecção Inteligente

O sistema usa **regex patterns** para extrair:

1. **Valor** - `R$ 123,45` ou `R$123.45`
2. **Nome do destinatário/remetente** - "Pix para João Silva"
3. **Estabelecimento** - "Compra em IFOOD"
4. **Tipo de transação** - Pix, Compra, Transferência

### **Exemplo de Detecção:**

Notificação: `"Pix enviado para Maria Santos no valor de R$ 150,00"`

**Dados Extraídos:**
```typescript
{
  type: 'expense',
  amount: 150.00,
  description: 'Pix para Maria Santos',
  source: 'Nubank',
  transactionType: 'Pix Enviado',
  date: new Date()
}
```

**Transação Criada:**
```typescript
{
  type: 'expense',
  amount: 150.00,
  description: 'Pix para Maria Santos',
  categoryId: '...', // Categoria apropriada
  notes: 'Detectado automaticamente de Nubank - Pix Enviado'
}
```

---

## 🎯 Categorização Automática

O sistema tenta categorizar automaticamente:

### **Compras:**
- **iFood, Rappi** → Alimentação
- **Uber, 99** → Transporte
- **Outros** → Compras

### **Pix e Transferências:**
- Categoria padrão: "Outros"

Você pode melhorar a categorização editando:
`src/services/bank-transaction-detector.service.ts` método `findAppropriateCategory()`

---

## 🔧 Personalização

### **Adicionar Novos Padrões:**

Edite `src/services/bank-transaction-detector.service.ts`:

```typescript
private nubankPatterns = {
  // Adicione novos padrões aqui
  saque: /saque.*?r\$\s*([\d.,]+)/gi,
  // ...
};
```

### **Suportar Novos Bancos:**

```typescript
private supportedBankApps = [
  'com.nu.production',
  'seu.novo.banco', // Adicione o package name
];
```

### **Melhorar Extração:**

```typescript
// Adicione novos métodos de extração
private extractMerchantName(text: string): string | null {
  // Sua lógica personalizada
}
```

---

## 📱 Console Logs

Todos os passos são logados no console:

```
📱 ExternalNotificationService inicializado
🏦 BankTransactionDetectorService inicializado
✅ Escuta de notificações iniciada - Logs serão exibidos no console
📲 Notificação externa recebida: {app: "Nubank", title: "...", ...}
🔍 Processando notificação: {app: "Nubank", ...}
✅ App bancário detectado: Nubank
🔎 Analisando texto: pix enviado para joão r$ 50,00
💵 Valor extraído: 50
💰 Transação detectada: {type: "expense", amount: 50, ...}
➕ Adicionando transação detectada: ...
✅ Transação adicionada: {...}
```

---

## ⚠️ Importante: Segurança e Privacidade

### **Permissão Sensível:**

- Requer `BIND_NOTIFICATION_LISTENER_SERVICE`
- Permite ler **TODAS** as notificações do dispositivo
- Usuário deve conceder manualmente nas configurações

### **O que o app faz com as notificações:**

✅ Processa apenas notificações de apps bancários
✅ Extrai apenas valores e descrições de transações
✅ **NÃO armazena** notificações permanentemente
✅ **NÃO envia** dados para servidores externos
✅ Todos os dados ficam no dispositivo

### **Transparência:**

- Todo o código está disponível para auditoria
- Logs detalhados para verificar o que está sendo processado
- Usuário pode parar a detecção a qualquer momento

---

## 🐛 Troubleshooting

### **❌ "Permissão não concedida"**
- Verifique se habilitou o app nas Configurações
- Caminho: Configurações > Notificações > Acesso a notificações > Financial Control

### **❌ "Transação não detectada"**
- Verifique os logs do console
- A notificação pode ter um formato diferente
- Adicione novos padrões em `bank-transaction-detector.service.ts`

### **❌ "Valor extraído incorretamente"**
- Veja o log: `💵 Valor extraído: X`
- Ajuste os patterns em `extractAmount()`

### **❌ "Categorização errada"**
- Edite `findAppropriateCategory()` para melhorar a lógica

---

## 📚 Arquivos Importantes

```
android/app/src/main/java/io/ionic/starter/notifications/
├── AppNotificationListenerService.java     # Serviço Android
└── NotificationListenerPlugin.java         # Plugin Capacitor

src/services/
├── external-notification.service.ts        # Captura notificações
├── bank-transaction-detector.service.ts    # Detecta transações
└── notification.service.ts                 # Integração
```

---

## 🎉 Pronto!

Agora você tem detecção automática de transações bancárias!

### **Próximos Passos:**

1. ✅ Build e sync: `npm run build:prd && npx cap sync`
2. ✅ Conceda permissão nas configurações
3. ✅ Inicie a detecção
4. ✅ Faça uma transação no Nubank
5. ✅ Veja a mágica acontecer! ✨

**Dica:** Adicione um toggle no Dashboard para ativar/desativar facilmente a detecção!

---

## 💡 Ideias Futuras

- [ ] Machine Learning para categorização inteligente
- [ ] Suporte a mais bancos
- [ ] Detecção de boletos pagos
- [ ] Análise de padrões de gastos
- [ ] Alertas de gastos incomuns

**Divirta-se! 🚀**
