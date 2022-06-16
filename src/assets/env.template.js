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

(function(window) {
    window.env = window.env || {
        client_id: {
            prescription: "",
            formulary: "",
            dispense: "",
            cqleditor: ""
        }
    };

    // Environment variables
    window.env.client_id.prescription = "${CLIENT_ID_PRESCRIPTION}";
    window.env.client_id.formulary = "${CLIENT_ID_FORMULARY}";
    window.env.client_id.dispense = "${CLIENT_ID_DISPENSE}";
    window.env.client_id.cqleditor = "${CLIENT_ID_CQL_EDITOR}";
    window.env.cio_dc_credential = "${CIO_DC_CREDENTIAL}";
    window.env.tio_credential = "${TIO_CREDENTIAL}";
    window.env.cql_library_credential = "${CQL_LIBRARY_CREDENTIAL}";
    window.env.debug = true;
})(this);
