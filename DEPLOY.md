# Servidor PSCI com Docker

- Código: [Thiago-Caffaro/PSCI](https://github.com/Thiago-Caffaro/PSCI), privado.
- Imagem: `ghcr.io/thiago-caffaro/psci:latest`, privada.
- Plataformas publicadas: Linux `amd64` e `arm64`.
- O frontend compilado e a API são servidos juntos na porta **3001**.
- O banco fica no volume **psci-data**, em `/app/data/psci.json` dentro do contêiner.

## Iniciar no servidor

Instale Docker Engine e o plugin Docker Compose. Copie o arquivo `compose.yaml` deste repositório para uma pasta no servidor e execute os comandos a partir dessa pasta.

Como a imagem é privada, crie um **personal access token (classic)** no GitHub com o escopo `read:packages`, usando uma conta com acesso ao pacote. Faça login e cole o token quando o Docker pedir a senha:

```bash
docker login ghcr.io --username Thiago-Caffaro
docker compose pull
docker compose up -d
docker compose ps
```

Abra `http://IP_DO_SERVIDOR:3001`. A conexão inicial usa as contas documentadas no README; altere as senhas iniciais no aplicativo antes de disponibilizar o acesso aos jogadores.

Opcionalmente, crie um arquivo `.env` ao lado do `compose.yaml` para mudar a porta externa, o endereço de escuta ou a versão:

```dotenv
PSCI_PORT=3001
PSCI_BIND=0.0.0.0
PSCI_IMAGE=ghcr.io/thiago-caffaro/psci:latest
```

Para um proxy reverso no mesmo servidor, use `PSCI_BIND=127.0.0.1`. O proxy precisa encaminhar `/api/events` sem buffering e permitir conexões longas para as atualizações SSE.

### Alternativa sem Compose

Após o login no GHCR:

```bash
docker run -d --name psci --restart unless-stopped --init \
  -p 3001:3001 \
  -v psci-data:/app/data \
  ghcr.io/thiago-caffaro/psci:latest
```

Escolha um dos métodos para administrar a instância.

## Atualizar

```bash
docker compose pull
docker compose up -d
docker compose logs --tail=50 psci
```

O volume mantém contas, fichas, fotos, sessões e configurações durante a recriação do contêiner. Não use `docker compose down --volumes` nem remova `psci-data` se quiser preservar a campanha. Mantenha uma única instância usando esse banco JSON.

Cada push para `main` valida o aplicativo, testa a persistência em um contêiner e publica uma nova imagem `latest`. Uma tag `v0.1.0`, por exemplo, publica também `0.1.0` e `0.1`. Cada publicação recebe uma tag `sha-<commit completo>` para permitir fixar uma versão ou voltar a uma imagem anterior. A publicação não reinicia o servidor automaticamente; aplique a atualização com os comandos acima.

## Backup e migração da campanha

Para obter uma cópia consistente:

```bash
docker compose stop psci
docker compose cp psci:/app/data/psci.json ./psci-backup.json
docker compose up -d
```

Para restaurar um backup ou importar o `data/psci.json` usado no desenvolvimento, transfira esse arquivo ao servidor por um canal privado e salve como `psci-backup.json`. Com o contêiner já criado:

```bash
docker compose stop psci
docker compose cp ./psci-backup.json psci:/app/data/psci.json
docker compose run --rm --no-deps --user root --entrypoint chown psci node:node /app/data/psci.json
docker compose up -d
```

Esse procedimento substitui a campanha do servidor pelo backup. O repositório e a imagem não incluem o banco local, fotos de jogadores ou sessões.

## Diagnóstico e build local

```bash
docker compose logs -f psci
curl http://127.0.0.1:3001/api/health
docker inspect --format '{{.State.Health.Status}}' "$(docker compose ps -q psci)"
```

Para construir e testar sem publicar:

```bash
docker build -t psci:local .
npm run test:container
```

O teste usa um contêiner e um volume temporários próprios. Verifica frontend, API, login e persistência dos dados e da sessão após recriar o contêiner; ao terminar, remove somente esses recursos de teste.

## Referências

- [GitHub: publicação de imagens com Actions](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images).
- [GitHub: GHCR e autenticação para pacotes privados](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).
- [Docker: imagens para múltiplas plataformas](https://docs.docker.com/build/ci/github-actions/multi-platform/).
