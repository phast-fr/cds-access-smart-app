export const environment = {
  production: true,
  client_id: new Map<string, string>([
    ['prescription', '6965909a-8366-4236-ac7f-d754cd40bbdd'],
    ['formulary', 'c9344bf2-96e2-4274-9a33-4ba502b25a42'],
    ['dispense', 'ab8da2e9-3a40-44e5-b040-d3164975dccf']
  ]),
  scope: new Map<string, string>([
    ['prescription', 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*'],
    ['formulary', 'online_access profile openid fhirUser launch user/*.*'],
    ['dispense', 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*']
  ]),
  display_language: 'fr-FR',
  cds_hooks_url: 'https://cds-access.phast.fr:8443/cqf-ruler-r4',
  cio_dc_url: 'https://jade.phast.fr/resources-server/api/FHIR',
  cio_dc_credential: 'ZGF2aWQub3VhZ25lQHBoYXN0LmZyOjIncU1oa21+WFojdnpW',
  tio_url: 'https://jade.phast.fr/resources-server/api/FHIR',
  tio_credential: 'ZGF2aWQub3VhZ25lQHBoYXN0LmZyOjIncU1oa21+WFojdnpW',
  drug_formulary_resource_type: 'MedicationKnowledge'
};
