const express = require('express');
const { join } = require('path');
const { writeFileSync, readFileSync } = require('fs');
const { exec } = require('child_process');
const app = express();

const { port, password } = require(join(__dirname, '../config.json'));

const template = readFileSync(join(__dirname, '../template.txt'));

const proxyFileDir = "/etc/apache2/sites-enabled";

const protectedRoute = async (req, res, next) => {
    const reqToken = req.headers.authorization;
    if (!reqToken) {
        return res.status(400).json({
            error: true,
            status: 400,
            message: "You did not provide any authorization headers"
        });
    }

    if (reqToken !== password) {
        return res.status(403).json({
            error: true,
            status: 403,
            message: "The password you provided doesn't match the password required"
        });
    }

    next()
};

app.use(express.json());

app.get('/', (req, res) => {
    return res.status(200).send("OwO what are you doing here?");
});

app.post('/proxy/new', protectedRoute, (req, res) => {
    if (!req.body || !req.body.url || !req.body.destination) {
        return res.status(400).json({
            error: true,
            status: 400,
            message: "You did not provide proper data"
        });
    }

    const { url, destination } = req.body;

    const proxyFileTemplate = template.replaceAll('{url}', url).replaceAll('{destination}', destination);

    exec('certbot certonly -d ' + url + ' --non-interactive --webroot --webroot-path /var/www/html --agree-tos -m proxy@danbot.host', (error, stdout) => {
        const response = (error || stdout);

        if (response.includes("Congratulations!")) {
            writeFileSync(`${proxyFileDir}/${url}.conf`, proxyFileTemplate);
            exec('service apache2 restart', (error) => { if(error) return console.log('Problem restarting apache2!\n', error)});

            return res.status(200).json({
                error: false,
                status: 200,
                message: "Successfully linked domain."
            });
        } else if (response.includes("Certificate not yet due for renewal")) {
            writeFileSync(`${proxyFileDir}/${url}.conf`, proxyFileTemplate);
            exec('service apache2 restart', (error) => { if(error) return console.log('Problem restarting apache2!\n', error)});

            return res.status(200).json({
                error: false,
                status: 200,
                message: "Successfully linked domain."
            });
        } else {
            return res.status(500).json({
                error: true,
                status: 500,
                message: "Something went wrong."
            });
        }
    })
    
});

app.post('/proxy/delete', protectedRoute, (req, res) => {
    if (!req.body || !req.body.url) {
        return res.status(400).json({
            error: true,
            status: 400,
            message: "You did not provide proper data"
        })
    }

    const { url } = req.body;

    fs.unlinkSync(`${proxyFileDir}/${url}.conf`)
    exec('service apache2 restart', (error) => { if(error) return console.log('Problem restarting apache2!\n', error)});

    return res.status(200).json({
        error: false,
        status: 200,
        message: "Successfully unlinked domain."
    });
});

app.listen(port, () => {
    console.log(`Reverse Proxy Daemon Running On Port ${port}`);
});