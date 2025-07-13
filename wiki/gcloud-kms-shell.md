# 📚 Google Cloud KMS - Prontuario Operativo

> Comandi gcloud, implicazioni, accorgimenti e rischi.

### 📍Indice:
1. [Creazione Keyring](#creazione-keyring)
2. [Creazione Key](#creazione-key)
3. [Gestione Versioni](#gestione-versioni)
4. [Rotazione e Cambio Versione Primaria](#rotazione-e-cambio-versione-primaria)
5. [IAM Policy su Keys](#iam-policy-su-keys)
6. [Cancellazione e Distruzione](#cancellazione-e-distruzione)
7. [Migrazione Key / Cambio Nome](#migrazione-key--cambio-nome)
8. [Best Practices e Accorgimenti](#best-practices-e-accorgimenti)


[](#creazione-keyring)
## 🏷️ Creazione Keyring

```bash
gcloud kms keyrings create NOME_KEYRING --location=LOCATION
```

📌 Note:
* LOCATION può essere global, us-central1, ecc.
* I keyring sono contenitori logici, non cancellabili direttamente.
* Scegli una location coerente con i tuoi asset (es. bucket, istanze VM).


[](#creazione-key)
## 🔑 Creazione Key

```bash
gcloud kms keys create NOME_KEY --location=LOCATION --keyring=NOME_KEYRING --purpose=encryption
```

📌 Attenzione:
* Il nome è immutabile: valuta naming convenzioni (_env-app-purpose-v1_).
* Purpose può essere `encryption` o `asymmetric-signing`, `asymmetric-encryption`.


[](#gestione-versioni)
## 🔁 Gestione Versioni

Elenco versioni:
```bash
gcloud kms keys versions list --location=LOCATION --keyring=NOME_KEYRING --key=NOME_KEY
```

Creazione nuova versione:
```bash
gcloud kms keys versions list --location=LOCATION --keyring=NOME_KEYRING --key=NOME_KEY
```

[](#rotazione-e-cambio-versione-primaria)
## 🔄 Rotazione e Cambio Versione Primaria

```bash
gcloud kms keys set-primary-version NOME_KEY --location=LOCATION --keyring=NOME_KEYRING --version=NUMERO_VERSIONE
```

📌 Implicazioni:
* Solo la versione primaria è usata per cifrare.
* Versioni precedenti possono essere disabilitate o distrutte.


[](#iam-policy-su-keys)
## 🔐 IAM Policy su Keys

Concedere accesso a utente:
```bash
gcloud kms keys add-iam-policy-binding NOME_KEY --location=LOCATION --keyring=NOME_KEYRING --member="user:utente@example.com" --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"
```
📌 Accorgimenti:
* Audit log ogni accesso disponibile via Cloud Audit Logging.
* Usa gruppi IAM quando possibile (es. `group:devops@example.com`).


[](#cancellazione-e-distruzione)
## 🧨 Cancellazione e Distruzione

Disabilitare una versione:
```bash
gcloud kms keys versions disable VERSION --location=LOCATION --keyring=NOME_KEYRING --key=NOME_KEY
```

Distruggere definitivamente una versione:
```bash
gcloud kms keys versions destroy VERSION --location=LOCATION --keyring=NOME_KEYRING --key=NOME_KEY
```
📌 Nota critica:
* La distruzione è irreversibile.
* Verifica che la key non sia referenziata (es. da GCS con CMEK) o causerà errori silenziosi.


[](#migrazione-key--cambio-nome)
## 🔁 Migrazione Key / Cambio Nome

**📌 Non esiste `rename` per le chiavi.**

Strategia:
1. Creare nuova chiave con nome desiderato.
2. Ricriptare dati.
3. Aggiornare referenze (GCS, secrets, etc.).
4. Disabilitare o distruggere chiave vecchia.


[](#best-practices-e-accorgimenti)
## 🧠 Best Practices e Accorgimenti

* 🔒 Rotazione regolare (imposta da Terraform o script CI/CD).
* 📋 Audit IAM su chi può usare le chiavi: preferisci `roles/...Decrypter` a `Admin`.
* 💾 Backups dei dati cifrati prima di ogni distruzione.
* 🧪 Testing di decrypt in ambienti di staging prima di aggiornamenti.
* 🎯 Naming chiaro e versione nel nome, se non usi rotazione automatica (`keyname-v1`, `keyname-v2`).
* 🧱 Preferisci Secret Manager quando serve solo proteggere stringhe/cred.