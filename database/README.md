# Database - Manager Bet Aki

Este diretório contém todos os scripts SQL organizados para o banco Supabase.

## Estrutura de Pastas

```
/database
├── /migrations     # Scripts de criação/alteração do schema (ordenados)
├── /seeds          # Scripts para dados iniciais (buckets, admin, etc)
└── /archive        # Scripts antigos de correção (histórico)
```

## Migrations

| Arquivo | Descrição |
|---------|-----------|
| `001_initial_schema.sql` | Schema inicial do Supabase (tabelas principais) |
| `002_create_permissions.sql` | Sistema de permissões por role |
| `003_app_config.sql` | Configurações do app (logo, tema, etc) |
| `004_add_job_title.sql` | Adiciona cargo aos perfis |
| `005_enable_realtime.sql` | Habilita realtime nas tabelas |
| `006_evolution_v2.sql` | Evolução do schema v2 |

## Seeds

| Arquivo | Descrição |
|---------|-----------|
| `001_create_storage_bucket.sql` | Cria bucket de storage |
| `002_create_bucket.sql` | Configuração adicional de bucket |
| `003_create_auth_user.sql` | Função para criar usuários |
| `004_create_master_admin.sql` | Cria usuário admin principal |

## Archive

Scripts de correção antigos mantidos para histórico. **Não execute** estes scripts diretamente - eles foram aplicados durante o desenvolvimento e podem causar conflitos.

## Como usar

1. Execute os scripts de **migrations** em ordem numérica
2. Execute os scripts de **seeds** após as migrations
3. Configure as variáveis de ambiente com as credenciais do Supabase

```bash
# Exemplo: aplicar migration via Supabase CLI
supabase db push
```
