// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

/**
 * Scope list
 *
 * smart/orchestrate_launch"
 * launch"
 * openid"
 * profile"
 * user/*.*"
 * user/*.read"
 * user/*.write"
 * user/AdverseReaction.read"
 * user/AdverseReaction.write"
 * user/Alert.read"
 * user/Alert.write"
 * user/Condition.read"
 * user/Condition.write"
 * user/Encounter.read"
 * user/Encounter.write"
 * user/FamilyHistory.read"
 * user/FamilyHistory.write"
 * user/Medication.read"
 * user/Medication.write"
 * user/MedicationPrescription.read"
 * user/MedicationPrescription.write"
 * user/MedicationStatement.read"
 * user/MedicationStatement.write"
 * user/Observation.read"
 * user/Observation.write"
 * user/Patient.read"
 * user/Patient.write"
 * user/Substance.read"
 * user/Substance.write"
 * patient/*.*"
 * patient/*.read"
 * patient/*.write"
 * patient/AdverseReaction.read"
 * patient/AdverseReaction.write"
 * patient/Alert.read"
 * patient/Alert.write"
 * patient/Condition.read"
 * patient/Condition.write"
 * patient/Encounter.read"
 * patient/Encounter.write"
 * patient/FamilyHistory.read"
 * patient/FamilyHistory.write"
 * patient/MedicationPrescription.read"
 * patient/MedicationPrescription.write"
 * patient/MedicationStatement.read"
 * patient/MedicationStatement.write"
 * patient/Observation.read"
 * patient/Observation.write"
 * patient/Patient.read"
 * patient/Patient.write"
 * system/*.read"
 * system/*.write"
 * launch/patient"
 * launch/encounter"
 * launch/location"
 * patient/AllergyIntolerance.read"
 * patient/AllergyIntolerance.write"
 * user/AllergyIntolerance.read"
 * user/AllergyIntolerance.write"
 * patient/DocumentReference.read"
 * patient/DocumentReference.write"
 * online_access"
 * user/Immunization.read"
 * user/Immunization.write"
 * user/MedicationOrder.read"
 * user/MedicationOrder.write"
 * patient/Immunization.read"
 * patient/Immunization.write"
 * patient/MedicationOrder.read"
 * patient/MedicationOrder.write"
 * offline_access"
 * fhirUser"
 */

export const environment = {
  production: false,
  client_id: '8bfdedf3-4f67-40ee-86b6-ebdf97cfd9f6',
  redirect_uri: 'https://localhost:4200/prescribe',
  scope: 'profile online_access openid launch fhirUser user/*.* user/*.read user/*.write patient/*.* patient/*.read patient/*.write',
  cds_hooks_url: 'https://localhost:8443/cqf-ruler-r4',
  cio_dc_url: 'https://jade.phast.fr/resources-server/api/FHIR',
  cio_dc_credential: 'ZGF2aWQub3VhZ25lQHBoYXN0LmZyOjIncU1oa21+WFojdnpW'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
