# Salesforce MFA 2026 Enforcement Guide

## Overview
Salesforce is strengthening its security posture by implementing mandatory technical enforcements for Multi-Factor Authentication (MFA) and introducing stricter requirements for privileged users and sensitive data access. These changes are slated for rollout in mid-2026.

---

## 1. Key Enforcement Timelines

### Phishing-Resistant MFA (Privileged Users)
Applies to users with the **System Administrator** profile or specific privileged permissions (*Modify All Data, View All Data, Customize Application, or Author Apex*).
*   **Sandboxes:** Starting June 22, 2026
*   **Production:** Starting July 1, 2026

### Mandatory MFA (All Employee Users)
Applies to all employee logins, including direct UI and Single Sign-On (SSO).
*   **Sandboxes:** Starting June 22, 2026
*   **Production:** Starting July 20, 2026

---

## 2. Technical Requirements

### Step-up Authentication for Reports & Dashboards
A new framework requires users to complete an MFA challenge when performing sensitive actions (viewing, running, or exporting reports/dashboards).
*   **Trigger:** Triggered when the user accesses the report, not just on download.
*   **Configurability:** Admins can set the "Step-Up Authentication Period" between **2 and 120 minutes** on the Identity Verification page.

### SSO Signal Requirements
For organizations using SSO (Okta, Entra ID, etc.), Salesforce will inspect the SAML or OIDC assertion for specific authentication signals.

| Tier | Recognized Signals (ACR/AMR) |
| :--- | :--- |
| **Phishing-Resistant** | `fido`, `fido2`, `pki`, `X509`, `cert`, `hwk`, `sc`, `Smartcard`, `TLSClient` |
| **Standard** | `multipleauthn`, `webauthn`, `otp`, `passkey`, `okta_verify` |
| **Weak / None** | `pwd` |

**Note:** If your IdP does not send a recognized signal, Salesforce will prompt the user to enroll in a Salesforce-managed MFA method, even if they already completed MFA at the IdP level.

---

## 3. Step-by-Step Solution Roadmap

### Step 1: Inventory and Audit
*   Identify all users in scope for "Phishing-Resistant" MFA. This includes any user with the *System Administrator* profile or the *Modify All Data*, *View All Data*, *Customize Application*, or *Author Apex* permissions.
*   Audit existing SSO configurations to see what signals (ACR/AMR) your Identity Provider is currently sending.

### Step 2: Upgrade MFA Methods
*   **For Admins:** Deploy WebAuthn-compatible methods such as FIDO2 Security Keys (e.g., YubiKey) or Built-in Authenticators (e.g., Windows Hello, Touch ID).
*   **For Employees:** Ensure all users have at least one registered MFA method (Salesforce Authenticator, TOTP apps, or Passkeys).

### Step 3: Align IdP Configuration
*   Work with your Identity/SSO team to ensure that when a user authenticates with a strong method, the corresponding signal (like `fido` or `multipleauthn`) is passed to Salesforce in the SAML response or OIDC token.

### Step 4: Enable "Step-up" Policies
*   Navigate to **Setup > Identity Verification**.
*   Enable the **"Require periodic step-up authentication"** policy for Reports and Dashboards.
*   Configure the re-authentication cadence (e.g., 60 minutes) based on your organization's risk profile.

### Step 5: Sandbox Testing
*   Activate the MFA enforcement setting in a Sandbox environment before the June 22, 2026 deadline.
*   Verify that admins can log in successfully using phishing-resistant methods.
*   Confirm that SSO users are not being double-prompted if signals are correctly aligned.

---

## Resources
*   [Prepare for MFA Enforcement for All Employee Users](https://help.salesforce.com/s/articleView?id=005321561)
*   [Prepare for Phishing-Resistant MFA Enforcement for Privileged Users](https://help.salesforce.com/s/articleView?id=005321563)
*   [Step-up Authentication for Report Actions](https://help.salesforce.com/s/articleView?id=005321566)
