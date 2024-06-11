document.getElementById('submit-btn').addEventListener('click', function() {
    const fileInput = document.getElementById('csv-file');
    const statusDiv = document.getElementById('status');

    if (!fileInput.files.length) {
        statusDiv.textContent = 'Please select a CSV file.';
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const csvData = event.target.result;
        const dataArray = csvToArray(csvData);

        statusDiv.textContent = 'Sending data...';
        sendDataToAPI(dataArray);
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

async function sendDataToAPI(dataArray) {
    const statusDiv = document.getElementById('status');

    for (let data of dataArray) {
        try {

            if(data.Name !== undefined){
                const mobileNumber = Number(data.Mobile);
                const sendData = {
                    hash_key: "5b6d7976b00d759c8a44362866055056",
                    security_checksum: "afec026843a4ab6fd1b352189e2fadcf",
                    c_name: data.Name,
                    c_email: data.Email,
                    c_mobile: mobileNumber.toString(),
                    c_city: data.City,
                    state: data.State,
                    country: data.Country,
                    dist: data.District,
                    program_type: data.Program,
                    course_type: data.Course,
                    vs: "Generic"
                };

                const response = await fetch('https://leadboard.ctpl.io/api/v2', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(sendData)
                });
    
                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }
    
                statusDiv.textContent = `Data sent successfully: ${JSON.stringify(data)}`;
            } else {
                statusDiv.textContent = `Data is skipped`;
            }
        } catch (error) {
            statusDiv.textContent = `Failed to send data: ${error.message}`;
            break;
        }
    }
}
