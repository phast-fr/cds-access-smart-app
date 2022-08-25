// `.env.ts` is generated by the `npm run env` command
// `npm run env` exposes environment variables as JSON for any usage you might
// want, like displaying the version or getting extra config from your CI bot, etc.
// This is useful for granularity you might need beyond just the environment.
// Note that as usual, any environment variables you expose through it will end up in your
// bundle, and you should not use it for any sensitive information like passwords or keys.
import {npm} from './.env';

export const environment = {
  production: true,
  version: npm.npm_package_version,
  client_id: window['env']['client_id'] || '',
  scope: {
    prescription: 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*',
    formulary: 'online_access profile openid fhirUser launch user/*.*',
    dispense: 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*',
    cqleditor: 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*'
  },
  display_language: 'fr-FR',
  cds_hooks_url: 'https://cds-access.phast.fr:8443/cql-cds-hooks',
  cio_dc_url: 'https://recette.phast.fr/resources-server_Atelier/api/FHIR',
  cio_dc_credential: window['env']['cio_dc_credential'] || '',
  tio_url: 'https://recette.phast.fr/resources-server_Atelier/api/FHIR',
  tio_credential: window['env']['tio_credential'] || '',
  cql_service_url: 'https://cds-access.phast.fr:8443/cql-proxy/r4/fhir',
  cql_library_url: 'https://recette.phast.fr/resources-server_Atelier/api/FHIR',
  cql_library_auth: true,
  cql_library_credential: window['env']['cql_library_credential'] || '',
  fhir_date_short_format: 'yyyy-MM-dd\'T\'HH:mm:00',
  fhir_date_format: 'yyyy-MM-dd\'T\'HH:mm:ss',
  display_date_format: 'dd/MM/yyyy HH:mm',
  drug_formulary_resource_type: 'MedicationKnowledge',
  override_iss: false,
  overridden_iss: 'https://localhost'
};
