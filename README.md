# CDS-ACCESS Smart on FHIR App

[![MIT License][license-image]][license]![build](https://github.com/phast-fr/cds-access-smart-app/actions/workflows/ci.yml/badge.svg)

Smart on FHIR App is a part of CDS ACCESS project which aims to facilitate the integration of CDS in the hospital.  

## Install

1. Have installed the prerequisites (git, node.js v16.x)
2. Clone the project: git clone https://github.com/phast-fr/cds-access-smart-app.git (for more details: https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
3. Install the application dependencies: in the cds-access-smart-app directory, run npm install
4. Creation of an account on the Logica Sandbox: https://sandbox.logicahealth.org/ (or another Smart on FHIR platform)
5. Create a Sandbox in FHIR R4 version
6. Register Prescription Smart App: App Launch URI: http://localhost:4200/prescription/launch; App Redirect URIs: http://localhost:4200/prescription; Scope: online_access profile openid fhirUser launch launch/user user/\*.\* patient/\*.\* (for more details: https://logica.atlassian.net/wiki/spaces/HSPC/pages/60915727/Sandbox+Registered+Apps)
7. Configuration\
   7.1. in the environment directory, create a credential.ts file on the template of the credential.template.ts file\
   7.2. in the newly created credential.ts file, update the client_id of the prescription module with the UUID obtained during the registration of the App and the identifiers obtained from PHAST in cio_dc_credential and tio_credential
8. Start listening to the server: in the cds-access-smart-app directory, run npm start
9. Launch the application from the Logica Sandbox

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg
[license]: LICENSE
