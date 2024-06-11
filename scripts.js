document.getElementById('submit-btn').addEventListener('click', function () {
    const fileInput = document.getElementById('csv-file');
    const endpointSelect = document.getElementById('endpoint-select');
    const statusDiv = document.getElementById('status');

    if (!fileInput.files.length) {
        statusDiv.textContent = 'Please select a CSV file.';
        return;
    }

    const file = fileInput.files[0];
    const selectedEndpoint = endpointSelect.value;
    const reader = new FileReader();

    reader.onload = function (event) {
        const csvData = event.target.result;
        const dataArray = csvToArray(csvData);

        statusDiv.textContent = 'Sending data...';
        sendDataToAPI(dataArray, selectedEndpoint);
    };

    reader.readAsText(file);
});

function csvToArray(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const data = lines.slice(1).map(line => {
        const values = line.split(',').map(value => value.trim());
        let obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index];
        });
        return obj;
    });

    return data;
}

async function sendDataToAPI(dataArray, endpoint) {
    const statusDiv = document.getElementById('status');

    let dataToSend = [];
    for (let data of dataArray) {
        if (data.Name !== undefined) {
            const mobileNumber = Number(data.Mobile);
            const sendData = {
                name: data.Name,
                email: data.Email,
                mobile: mobileNumber.toString(),
                city: data.City,
                state: data.State,
                country: data.Country,
                dist: data.District,
                program: data.Program,
                course: data.Course,
            };

            dataToSend.push(sendData);
        } else {
            statusDiv.textContent = `Invalid data: ${JSON.stringify(data)}`;
        }
    }

    const urlObj = new URL(endpoint);
    const params = new URLSearchParams(urlObj.search);
    const secretKey = params.get('secretkey');
    console.log(secretKey)
    const jsonString = JSON.stringify(dataToSend);
    const key = CryptoJS.enc.Utf8.parse(secretKey);
    const iv = CryptoJS.lib.WordArray.random(16);
    const encryptedData = CryptoJS.AES.encrypt(jsonString, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    const encryptedString = iv.concat(encryptedData.ciphertext).toString(CryptoJS.enc.Base64);

    params.append('encrypted_data', encryptedString);

    urlObj.search = params.toString();
    const updatedUrl = urlObj.toString();

    const response = await fetch(updatedUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
    }

    const responseData = await response.json();
    statusDiv.textContent = `Data sent successfully to ${endpoint}`;
    displayResponseData(responseData);
    try {

    } catch (error) {
        statusDiv.textContent = `Failed to send data to ${endpoint}: ${error.message}`;
    }
}

function displayResponseData(responseData) {
    const responseDiv = document.createElement('div');
    responseDiv.className = 'response-data';

    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(responseData, null, 2);
    responseDiv.appendChild(pre);

    const statusDiv = document.getElementById('status');
    statusDiv.appendChild(responseDiv);
}
