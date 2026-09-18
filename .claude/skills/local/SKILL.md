---
name: local
description: Délègue une sous-tâche bornée au harness Claude Code LOCAL (claude-local → Ollama sur la RTX 5090) pour ne pas consommer le quota Anthropic. Déclencheurs — "/local", "fais-le en local", "délègue à l'IA locale", "hors quota", ou proactivement quand une tâche est bornée, en lecture, vérifiable et qu'une erreur coûte peu.
argument-hint: <tâche à déléguer> [--model qwen3-coder:30b]
allowed-tools: Bash, Read, Glob, Grep
---

# /local — déléguer au modèle local

Le harness Claude Code tourne nativement sur Ollama (`ANTHROPIC_BASE_URL`), en
mode `--bare`. Le wrapper `claude-local` encapsule tout (`scripts/claude-local.sh`
de claude-code-codex, lié dans `~/.local/bin`). Ce skill décide **quoi** lui
confier, **comment** formuler la consigne, et **comment** vérifier le retour.
Claude (Opus/Fable) reste le décideur et le relecteur ; le modèle local est un
exécutant rapide et gratuit.

## Déléguer ou pas — la règle en 4 tests

Déléguer seulement si les 4 sont vrais :

| Test | Oui → déléguer | Non → garder |
|---|---|---|
| **Borné** | 1 à 5 fichiers, une sortie attendue précise | multi-fichiers, refacto, architecture |
| **Autonome** | tout le contexte tient dans le prompt + les fichiers cités | dépend de CLAUDE.md, de la mémoire, de l'historique de session |
| **Vérifiable** | je peux contrôler le résultat en moins de temps qu'il m'en faudrait pour le produire | résultat invérifiable sans le refaire |
| **Faible enjeu** | une erreur coûte une relecture | touche la prod, le gitops, un secret, une donnée |

Bons candidats : résumé/relecture d'un doc, extraction d'une liste (fonctions,
endpoints, TODO), revue d'un fichier isolé, relecture EN, classement, génération
de fixtures ou de tests unitaires simples, première passe sur un log.
Jamais : bump gitops, SQL de boot, migration, tout ce qui suit un `livrer.sh`.

## Procédure

1. **Ollama vivant ?** `curl -s -m 3 http://127.0.0.1:11434/api/version`. Sinon :
   `OLLAMA_CONTEXT_LENGTH=32768 nohup ollama serve > ~/projects/developpeur/tmp/ollama-serve.log 2>&1 &`
   (jamais `pkill -f "ollama serve"` : le motif matche le shell appelant).
2. **Écrire un prompt autonome.** Le modèle local n'a ni CLAUDE.md, ni mémoire,
   ni contexte de session. Le prompt doit contenir : les chemins exacts à lire,
   l'outil à utiliser (« avec l'outil Read »), le format de sortie attendu, la
   langue, une borne de longueur. Une consigne vague = une réponse vague.
3. **Restreindre les outils** : `--tools "Read,Glob,Grep"` par défaut. Pas de
   `Write`/`Edit`/`Bash` en headless — le classificateur du mode auto le refuse,
   et c'est sain. Si le résultat doit être écrit, le modèle le rend sur stdout et
   c'est moi qui écris après relecture.
4. **Lancer**, depuis le dossier du projet concerné, avec un timeout :
   ```bash
   cd <projet> && timeout 300 claude-local "<prompt>" --tools "Read,Glob,Grep" 2>/dev/null
   ```
   Un seul appel à la fois (la VRAM ne tient qu'un modèle 30B + son cache).
   Modèle par défaut : `qwen3-coder:30b` (12 s à chaud, 2 s en cache, 100 % GPU,
   mesuré 18/09). `CLAUDE_LOCAL_MODEL=qwen3:32b` si on veut du raisonnement
   plus verbeux (~16 s), `llama3.1:8b` pour du très simple.
5. **Vérifier avant de s'en servir** — [[feedback_reverifier_apres_un_agent]]
   s'applique intégralement : contrôler au moins un point factuel du retour
   contre la source (un chemin, une fonction, un chiffre). Si le retour est
   creux ou hors sujet, ne pas relancer trois fois : reprendre la tâche moi-même.
6. **Dire ce qui a été délégué** dans la réponse à Sylvain : « fait en local
   (qwen3-coder, 14 s) », pour qu'il sache ce qui n'a pas coûté de quota.

## Exemple

Sylvain : « liste les endpoints du backend finance sans test ».
```bash
cd ~/projects/developpeur/finance-tracker/backend && timeout 300 claude-local \
 "Avec Glob, liste src/**/*.controller.ts. Avec Read, lis chacun. Réponds en français \
  par un tableau markdown : fichier | méthode HTTP | route | un fichier *.spec.ts \
  correspondant existe (oui/non, vérifie avec Glob). Rien d'autre." \
 --tools "Read,Glob" 2>/dev/null
```
Puis je vérifie 2 lignes du tableau contre les sources avant de répondre.

## Anti-patterns

- ❌ Lancer sans `--bare` (le wrapper l'impose) : le prompt système complet
  dépasse 32k tokens, Ollama tronque, le modèle répond « I'm ready to help ».
- ❌ Déléguer pour « gagner du temps » une tâche qui demande le contexte projet :
  le résultat sera plausible et faux.
- ❌ Prendre le retour local pour argent comptant, ou l'écrire dans un fichier
  sans relecture.
- ❌ Plusieurs `claude-local` en parallèle.
- ❌ Utiliser `gemma3:27b` : pas d'appel d'outils.
