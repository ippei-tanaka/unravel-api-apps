import {expect} from 'chai';
import HttpClient from '../http-client';
import {testUser, admin} from './_data';

export default () =>
{
    describe('/users', () =>
    {
        const config = require("../../src/config");

        let client;

        beforeEach(() =>
        {
            client = new HttpClient({
                port: config.getValue('webPort'),
                hostname: config.getValue('webHost'),
                pathbase: config.getValue('adminApiRoot')
            });
        });

        beforeEach('login', () => client.post("/login", admin));
        afterEach('logout', () => client.get("/logout"));

        it('should return the login user data', async () =>
        {
            const user = await client.get("/users/me");
            expect(user.email).to.equal(admin.email);
            expect(user.slug).to.equal(admin.slug);
            expect(user.display_name).to.equal(admin.display_name);
            expect(user).to.not.have.property('password');
        });

        it('should create a new user', async () =>
        {
            const {_id} = await client.post("/users", testUser);
            const user = await client.get(`/users/${_id}`);
            expect(user._id).to.equal(_id);
        });

        it('should return error messages if failing to create a new user', async () =>
        {
            let errors;

            try
            {
                await client.post("/users", {});
            }
            catch (e)
            {
                errors = e;
            }

            expect(errors.body.email[0]).to.equal("The email is required.");
            expect(errors.body.password[0]).to.equal("The password is required.");
            expect(errors.body.display_name[0]).to.equal("The display name is required.");
            expect(errors.body.slug[0]).to.equal("The slug is required.");
        });

        it('should not include a password in the retrieved user data', async () =>
        {
            const {_id} = await client.post("/users", testUser);
            const user = await client.get(`/users/${_id}`);
            expect(user).to.not.have.property('password');
        });

        it("should update a user's display name", async () =>
        {
            const {_id} = await client.post("/users", testUser);

            let user = await client.get(`/users/${_id}`);
            expect(user.display_name).to.equal(testUser.display_name);

            await client.put(`/users/${_id}`, {
                display_name: "My new name"
            });

            user = await client.get(`/users/${_id}`);
            expect(user.display_name).to.equal("My new name");
        });

        it("should not update a user's password on '/users/:id/' path", async () =>
        {
            let error;

            try
            {
                const {_id} = await client.post("/users", testUser);
                await client.put(`/users/${_id}`, {
                    password: "NewPassword@@@",
                    password_confirmed: "NewPassword@@@",
                    old_password: testUser.password
                });
            }
            catch (e)
            {
                error = e;
            }

            expect(error.body.password[0]).to.equal("The password can't be updated.");
        });

        it("should not update a user's password unless the confirmed password and their old password is sent", async () =>
        {
            let error;

            try
            {
                const {_id} = await client.post("/users", testUser);
                await client.put(`/users/${_id}/password`, {
                    password: "NewPassword@@@"
                });
            }
            catch (e)
            {
                error = e;
            }

            expect(error.body.old_password[0]).to.equal('The current password is required.');
            expect(error.body.password_confirmed[0]).to.equal('The confirmed password is required.');
        });

        it("should not update a user's password if the new password isn't sent", async () =>
        {
            let error;

            try
            {
                const {_id} = await client.post("/users", testUser);
                await client.put(`/users/${_id}/password`, {
                    password: "",
                    password_confirmed: "NewPassword@@@",
                    old_password: testUser.password
                });
            }
            catch (e)
            {
                error = e;
            }

            expect(error.body.password[0]).to.equal('The new password is required.');
        });

        it("should update a user's password if the confirmed password and their old password is sent", async () =>
        {
            const {_id} = await client.post(`/users`, testUser);

            await client.put(`/users/${_id}/password`, {
                password: "NewPassword@@@",
                password_confirmed: "NewPassword@@@",
                old_password: testUser.password
            });
        });

        it("should return proper error messages when the new password got a validation error", async () =>
        {
            const {_id} = await client.post("/users", testUser);

            let error;

            try
            {
                await client.put(`/users/${_id}/password`, {
                    password: "p ss wo r d",
                    password_confirmed: "",
                    old_password: "Wrong Pass"
                });
            }
            catch (e)
            {
                error = e;
            }

            expect(error.body.password[0]).to
                                          .equal('Only alphabets, numbers and some symbols (#, !, @, %, &, *) are allowed for a password.');
            expect(error.body.password_confirmed[0]).to.equal('The confirmed password is required.');
            expect(error.body.old_password[0]).to.equal('The current password sent is not correct.');
        });

        it("should not update a user's password if their old password is wrong", async () =>
        {
            let error;

            try
            {
                const {_id} = await client.post("/users", testUser);

                await client.put(`/users/${_id}/password`, {
                    password: "NewPassword@@@",
                    password_confirmed: "NewPassword@@@",
                    old_password: "WrongPassword"
                });
            }
            catch (e)
            {
                error = e;
            }

            expect(error.body.old_password[0]).to.equal('The current password sent is not correct.');
        });

        it("should not update a user's password if the confirmed password is wrong", async () =>
        {
            let error;

            try
            {
                const {_id} = await client.post("/users", testUser);

                await client.put(`/users/${_id}/password`, {
                    password: "NewPassword@@@",
                    password_confirmed: "qwerqwer",
                    old_password: testUser.password
                });
            }
            catch (e)
            {
                error = e;
            }

            expect(error.body.password_confirmed[0]).to
                                                    .equal('The confirmed password sent is not the same as the new password.');
        });

    });
};