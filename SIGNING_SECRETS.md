# Code Signing Secrets for GitHub Actions

Add all of these as **Repository Secrets** in GitHub:
**Settings → Secrets and variables → Actions → New repository secret**

---

## Windows — DigiCert KeyLocker (EV Code Signing)

| Secret name                  | Where to find it                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| `KEYLOCKER_HOST`             | DigiCert CertCentral → Automation → KeyLocker. Typically `https://clientauth.one.digicert.com`         |
| `KEYLOCKER_WINDOWS_KEY`      | CertCentral → Account → Access → API Keys. Generate a new one if you can't find the old value.        |
| `KEYLOCKER_CLIENT_CERT`      | The base64-encoded `.p12` client authentication certificate from KeyLocker setup. See note below.      |
| `KEYLOCKER_CLIENTAUTHCERT_PW`| The password you set when you exported/downloaded the client auth `.p12` file. Check password manager. |
| `KEYLOCKER_CERT_SHA1_HASH`   | CertCentral → Orders → Order #1503925739 → "Additional certificate information" → SHA1 Thumbprint.    |

### How to base64-encode the client cert (.p12)

If you have the `.p12` file on disk:

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\Certificate_pkcs12.p12"))
```

**Mac/Linux:**
```bash
base64 -i /path/to/Certificate_pkcs12.p12
```

Paste the entire base64 string as the value of `KEYLOCKER_CLIENT_CERT`.

### If you lost the client auth cert or API key

1. Log in to CertCentral at https://www.digicert.com/certcentral
2. Go to **My Digital Trust Products → KeyLocker**
3. You can generate a new client authentication certificate there
4. For the API key: **Account → Access → API Keys → Create API Key**

---

## macOS — Apple Developer Program (Signing + Notarization)

| Secret name                   | Where to find it                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `MACOS_CERT_BASE64`           | Your "Developer ID Application" certificate exported as `.p12`, then base64-encoded. See below.   |
| `MACOS_CERT_PASSWORD`         | The password you set when exporting the `.p12` from Keychain Access.                              |
| `MACOS_KEYCHAIN_PASSWORD`     | Any random string — used to create a temporary keychain in CI. Make one up (e.g. `ci-build-2024`).|
| `APPLE_ID`                    | Your Apple ID email (the one enrolled in Apple Developer Program).                                |
| `APPLE_APP_SPECIFIC_PASSWORD` | Generated at https://appleid.apple.com → Sign-In and Security → App-Specific Passwords.          |
| `APPLE_TEAM_ID`               | https://developer.apple.com/account → Membership details → Team ID (10-character alphanumeric).  |

### How to export and encode the macOS signing certificate

1. Open **Keychain Access** on your Mac
2. Find your **"Developer ID Application: Nice Touch Group Ltd"** certificate
3. Right-click → **Export Items…** → save as `.p12` (set a strong password)
4. Base64-encode it:

```bash
base64 -i ~/Desktop/DeveloperID.p12 | pbcopy
```

This copies the base64 string to your clipboard. Paste it as `MACOS_CERT_BASE64`.

### If you need a new app-specific password

1. Go to https://appleid.apple.com
2. Sign in → **Sign-In and Security** → **App-Specific Passwords**
3. Click **Generate** and give it a label like "nt-converter CI"
4. Copy the generated password as `APPLE_APP_SPECIFIC_PASSWORD`

---

## Checklist

- [ ] `KEYLOCKER_HOST`
- [ ] `KEYLOCKER_WINDOWS_KEY`
- [ ] `KEYLOCKER_CLIENT_CERT`
- [ ] `KEYLOCKER_CLIENTAUTHCERT_PW`
- [ ] `KEYLOCKER_CERT_SHA1_HASH`
- [ ] `MACOS_CERT_BASE64`
- [ ] `MACOS_CERT_PASSWORD`
- [ ] `MACOS_KEYCHAIN_PASSWORD`
- [ ] `APPLE_ID`
- [ ] `APPLE_APP_SPECIFIC_PASSWORD`
- [ ] `APPLE_TEAM_ID`

Once all 11 secrets are added, the workflow needs to be updated with the signing steps.
Do NOT commit this file — add it to .gitignore or delete it after use.
