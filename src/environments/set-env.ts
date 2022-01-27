/*
 * MIT License
 *
 * Copyright (c) 2021 PHAST
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import ErrnoException = NodeJS.ErrnoException;

const setEnv = () => {
    const fs = require('fs');
    const writeFile = fs.writeFile;
// Configure Angular `environment.ts` file path
    const targetPath = './src/environments/environment.ts';
// Load node modules
    const colors = require('colors');
    const appVersion = require('../../package.json').version;
    /*require('dotenv').config({
        path: 'src/environments/.env'
    });*/
// `environment.ts` file structure
    const envConfigFile = `export const environment = {
  npm_package_version: '${appVersion}',
  client_id: '${process.env.client_id}',
  cio_dc_url: 'https://recette.phast.fr/resources-server_Atelier/api/FHIR',
  cio_dc_credential: '${process.env.cio_dc_credential}',
  tio_url: 'https://recette.phast.fr/resources-server_Atelier/api/FHIR',
  tio_credential: '${process.env.tio_credential}',
  display_language: 'fr-FR',
  cds_hooks_url: 'https://cds-access.phast.fr:8443/cql-cds-hooks',
  cql_service_url: 'https://cds-access.phast.fr:8443/cql-proxy/r4/fhir',
  fhir_date_short_format: 'yyyy-MM-dd\\'T\\'HH:mm:00',
  fhir_date_format: 'yyyy-MM-dd\\'T\\'HH:mm:ss',
  display_date_format: 'dd/MM/yyyy HH:mm',
  drug_formulary_resource_type: 'MedicationKnowledge',
  scope: {
    prescription: 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*',
    formulary: 'online_access profile openid fhirUser launch user/*.*',
    dispense: 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*',
    'cql-editor': 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*'
  },
  production: true
};
`;
    console.log(colors.magenta('The file `environment.ts` will be written with the following content: \n'));
    writeFile(targetPath, envConfigFile, (err: ErrnoException | null) => {
        if (err) {
            console.error(err);
            throw err;
        }
        else {
            console.log(colors.magenta(`Angular environment.ts file generated correctly at ${targetPath} \n`));
        }
    });
};
setEnv();
