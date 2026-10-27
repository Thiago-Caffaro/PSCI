# PSCI / Personal Sistem Card Id

Terminal de identidade e ficha de RPG inspirado no universo de **Goddess of Victory: NIKKE**. Primeira versão em React com JavaScript, interface voltada a celulares e servidor local com banco de documentos JSON.

## Executar

Requer Node.js **22.12+** (validado com Node 24).

```powershell
npm install
npm run dev
```

Abra **http://localhost:5173**. O desenvolvimento inicia o React na porta 5173 e a API na porta 3001. Para jogar no celular, conecte os dispositivos à mesma rede e use o endereço de rede exibido pelo Vite, por exemplo `http://192.168.x.x:5173`. Todos precisam se conectar ao mesmo servidor para compartilhar atualizações.

Para executar a versão de produção, com uma única porta:

```powershell
npm run build
npm start
```

Abra **http://localhost:3001**. `PORT`, `HOST` e `PSCI_DATA_FILE` podem ser definidos no ambiente. O arquivo `.env.example` documenta os valores; o projeto não carrega `.env` automaticamente. Exemplo em PowerShell: `$env:PORT = '3002'; npm start`.

## Contas iniciais

| Acesso                  | Usuário     | Senha      |
| ----------------------- | ----------- | ---------- |
| Comando / administrador | `admin`     | `admin123` |
| Jogador de demonstração | `unidade01` | `psci123`  |

As contas são criadas somente na primeira inicialização de um banco vazio. O painel de comando permite criar novas contas de jogador ou administrador, definir senhas, editar fichas e redefinir senhas de outras contas. Redefinições encerram as sessões anteriores da conta alterada.

## Funcionalidades

- Ficha com identificação, modelo, afiliação, esquadrão, atributos e perícias.
- HP e energia atuais ajustáveis pelo jogador, com indicadores de 20 e 10 segmentos, respectivamente; valores máximos e AC seguem as fórmulas recebidas.
- Botão de lápis para editar a própria identificação, foto, atributos e perícias. As alterações são salvas explicitamente e sincronizadas com o comando. Cada jogador edita somente sua ficha.
- Painel de comando com edição de fichas individuais.
- Diretrizes compartilhadas: operação, setor, comunicado, nomes dos atributos e perícias. É possível acrescentar perícias preservando os valores existentes.
- Atualização das telas conectadas por **Server-Sent Events (SSE)**, com reconexão automática.
- Tablet com duas faces e virada vertical de 180° pelo botão triangular laranja ou pela tecla Espaço. O atalho fica suspenso durante a digitação e em diálogos; outros controles preservam sua interação de teclado. A frente reúne identidade, recursos e uma grade de seis atributos; o verso reúne diário, equipamentos e habilidades livres.
- Contorno assimétrico seguindo o esboço: o módulo superior esquerdo do retrato corresponde ao módulo inferior esquerdo do NIMPH no verso.
- Diário, equipamentos e habilidades com rolagem interna e salvamento explícito. Virar o tablet ou abrir as configurações preserva a edição e a posição de leitura. Rascunhos também ficam no `sessionStorage` até serem salvos.
- Atributos em retângulos maiores, distribuídos em duas colunas com rolagem interna. Toque em um atributo para abrir uma leitura ampliada com todas as perícias e um acesso direto à edição desse grupo.
- Retrato no módulo superior esquerdo da frente, em um retângulo com dimensões proporcionais ao tablet. A imagem enviada continua sendo preparada em 240 × 300 px.
- O retrato e a visualização NIMPH degradam visualmente conforme a proporção de HP: saturação reduzida, ruído e falhas de imagem. Esses efeitos não alteram atributos, textos ou regras.
- Com HP em até 15% do máximo, as duas telas apresentam rachaduras e pequenas falhas gerais. As rachaduras não bloqueiam os controles; a preferência de efeitos e movimento reduzido desativa as animações.
- Upload de JPG, PNG ou WebP de até 8 MB. O navegador enquadra e converte o retrato para JPEG em base64; a API salva e devolve essa mesma representação no JSON. Jogador e comando podem alterar ou remover a foto. Não há serviço externo para imagens.
- Preferência local de efeitos, scanlines, varredura e interferências discretas; respeito a `prefers-reduced-motion`.
- Fontes distribuídas junto do aplicativo, sem depender de Google Fonts ou CDN.

## Regras desta versão

A ficha base está em `shared/schema.js` e reproduz os números fornecidos. A afiliação **Micilis** e o texto do bônus de Intuição foram mantidos conforme a proposta do projeto.

- HP máximo = `20 + (5 × Resistência)`.
- Energia máxima = `5`.
- AC = `10 + Agilidade`.
- Perícias não preenchidas são `null`, exibidas como **—**, e não são substituídas permanentemente por zero.
- Para a prévia inicial de HP, Resistência vazia é considerada zero.
- Valores de perícia e atributo base são independentes na interface; não há soma automática entre eles.
- Intuição começa em `+2`, incluindo o bônus Micilis já informado. A nota do bônus é editável; trocar a afiliação não aplica novas regras automaticamente.
- Não há implementação de dados, testes, progressão, dano, descanso ou regras adicionais.
- Alterar a Resistência recalcula o máximo de HP, preservando o valor atual quando possível. Recursos atuais não podem ultrapassar o máximo; nenhuma cura automática é aplicada.

## Armazenamento e sessões

O **lowdb** mantém o banco em `data/psci.json`, criado automaticamente. Contas, hashes de senha, fichas, fotos base64, configurações e registros persistem entre reinicializações. A pasta `data/` não entra no Git. Para preservar uma campanha, copie o banco com o servidor parado e mantenha uma cópia externa.

O navegador guarda a sessão em `localStorage` quando “Manter este terminal conectado” está marcado, ou em `sessionStorage` quando não está. A sessão permanece válida por até 30 dias e continua funcionando após reiniciar o servidor. Senhas não são guardadas no navegador nem retornadas pela API.

A última ficha recebida também fica no cache local. Quando a API está indisponível, a interface já carregada pode consultá-la, com edição desabilitada. Isso **não é uma PWA com instalação ou garantia de abertura totalmente offline**: os arquivos da aplicação ainda precisam estar acessíveis ou no cache HTTP do navegador. Atualizações entre dispositivos dependem do servidor ativo.

## Estrutura

```text
src/
  App.jsx              # Login, sessão e acesso a configurações/comando
  Tablet.jsx           # Duas faces, moldura SVG, recursos e registros
  PlayerEditor.jsx     # Edição da própria identificação, atributos e perícias
  tablet.css           # Layout físico responsivo e animação de virada
  Admin.jsx            # Contas, fichas e configurações compartilhadas
  PhotoEditor.jsx      # Conversão e envio de foto base64
  components.jsx       # Identidade visual, esquema da unidade e atributos
  api.js               # Sessão, cache e assinatura de atualizações
  styles.css           # Interface e responsividade
  styles-admin.css     # Painel de comando
server/
  app.js               # API, autenticação, validação, persistência e SSE
  index.js             # Inicialização do servidor
shared/schema.js       # Estrutura e valores iniciais da ficha
test/api.test.js        # Integração da API e persistência
e2e/terminal.spec.js    # Fluxos reais de navegador e sincronização
```

A moldura externa é um **placeholder SVG com superfícies planas e riscos leves**, implementado pelo componente `Housing` de `src/Tablet.jsx`. O mesmo contorno é espelhado verticalmente para o verso. `PortraitPlaceholder` e `NeuralPlaceholder` são imagens provisórias em SVG, substituíveis pelos assets finais. Texturas auxiliares simples ficam em `public/placeholders/`. A interface principal não usa gradientes decorativos.

A transição usa `rotateX(-180deg)` com faces separadas e a face inativa marcada como `inert`. O foco passa para o botão de retorno após a virada. A opção de efeitos reduzidos e `prefers-reduced-motion` desativam o movimento, mantendo ambas as faces acessíveis. Em telas pequenas, deslize a grade para consultar os seis atributos ou toque em um deles para abrir os detalhes.

## Verificações

```powershell
npm test       # Integração da API
npm run build # Build de produção
npm run check # Sintaxe, integração e build
npm run test:ui
```

Os testes de navegador usam Microsoft Edge no Windows; nas demais plataformas, instale o Chromium do Playwright com `npx playwright install chromium`. A API de teste usa um banco temporário separado, sem alterar os dados da campanha. Screenshots de validação são gravados em `.qa/` e não entram no Git.

## Referências de contexto

Aplicativo de fã para RPG; não é um produto oficial da SHIFT UP ou Level Infinite.

- [Ambientação oficial de NIKKE](https://nikke-en.com/)
- [Nikkes, NIMPH e tecnologia](https://nikke-goddess-of-victory-international.fandom.com/wiki/Nikke)
- [Arca](https://nikke-goddess-of-victory-international.fandom.com/wiki/Ark)
- [Esquadrões e fabricantes](https://nikke-goddess-of-victory-international.fandom.com/wiki/List_of_Nikke_Squads)

As mecânicas da ficha são as do sistema personalizado fornecido pelo autor do projeto.
