import express from 'express';
import {settings} from './_config';
import {AdminApiApp, PublicApiApp} from '../../src/app';

let server;
let app;
let adminApiApp;
let publicSiteApp;

export const start = async () =>
{
    if (!app)
    {
        app = express();
    }

    if (!adminApiApp)
    {
        adminApiApp = new AdminApiApp(settings);
        app.use(settings.adminApiRoot, adminApiApp);
    }

    if (!publicSiteApp)
    {
        publicSiteApp = new PublicApiApp(settings);
        app.use(settings.publicApiRoot, publicSiteApp);
    }

    server = await app.listen(settings.webPort, settings.webHost,
        error =>
        {
            if (error) throw error;
        }
    );

    console.log("Unravel has started.");
    console.log(`Public API: http://${settings.webHost}:${settings.webPort}${settings.publicApiRoot}`);
    console.log(`Admin API: http://${settings.webHost}:${settings.webPort}${settings.adminApiRoot}`);
};

export const createAdmin = async () =>
{

    if (adminApiApp)
    {
        await adminApiApp.insertUser({
            email: settings.adminEmail,
            password: settings.adminPassword,
            display_name: settings.adminDisplayName,
            slug: settings.adminSlug
        });

        console.log("Unravel has created an admin user.");

    }
    else
    {
        console.log("Unravel has failed to create an admin user.");
    }

};

export const stop = async () =>
{
    if (server)
    {
        console.log("Unravel has stopped.");
        await server.close();
    }
};