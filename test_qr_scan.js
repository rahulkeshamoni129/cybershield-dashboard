const axios = require('axios');
const fs = require('fs');
const path = require('path');

const login = async () => {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'analyst@cybershield.io',
            password: 'analystpassword123'
        });
        return res.data.token;
    } catch (err) {
        console.error('Login failed:', err.message);
        process.exit(1);
    }
};

const scanQR = async (token) => {
    try {
        const imagePath = path.join(__dirname, 'test_qr.png');
        const buffer = fs.readFileSync(imagePath);
        const base64Image = 'data:image/png;base64,' + buffer.toString('base64');

        console.log('Sending scan request...');
        const res = await axios.post('http://localhost:5000/api/qr/scan', {
            image: base64Image
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Scan Result:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('Scan failed:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
            console.error('Response status:', err.response.status);
        }
    }
};

const main = async () => {
    const token = await login();
    await scanQR(token);
};

main();
