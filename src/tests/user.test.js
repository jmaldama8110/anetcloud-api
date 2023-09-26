const request = require('supertest');
const app = require('../app');
const Signup = require('../model/signup');
const User = require('../model/user')
const Openpay = require('openpay');

const josmanUsr = {
    name: 'josman',
    lastname: 'gmz',
    email: 'josemanuek@hotmail.com',
    password: 'jm4ld4m4!'
}


beforeEach(async () => {
    // wipeout everthing from mongo db
    await Signup.deleteMany();
    await User.deleteMany();

})

test('Should signup a new user', async () => {

    await request(app)
        .post('/users/signup')
        .send(josmanUsr)
        .expect(201);
})

test('Should create a user from signup request', async () => {

    const juanperezSup = {
        code: '1234567',
        name: 'Juan',
        lastname: 'Perez',
        email: 'juanperezolote@gmail.com',
        password: 'ju4np3r3z@!'
    }

    wipeOpCustomers();

    const signup = new Signup(juanperezSup);
    await signup.save();

    await request(app)
        .post(`/users/create/${juanperezSup.code}`)
        .send()
        .expect(201);

});


test('Should create a plan for the new user', async () => {

    const plan_test = {
        amount: '120',
        name: 'Essentials service pack'
    }

    wipeSuscriptions();
    wipeOpPlans();
    wipeOpCustomers();

    const juanperezSup = {
        code: '1234567',
        name: 'Juan',
        lastname: 'Perez',
        email: 'juanperezolote@gmail.com',
        password: 'ju4np3r3z@!'
    }

    const suscription_test = {
        card_number: '4111111111111111',
        holder_name: `${juanperezSup.name} ${juanperezSup.lastname}`,
        expiration_year: '24',
        expiration_month: '12',
        cvv2: '110'
    }
    
    const signup = new Signup(juanperezSup);
    await signup.save();

    const res = await request(app)
        .post(`/users/create/${juanperezSup.code}`)
        .send()
        .expect(201);

    await request(app)
        .post('/plans/create')
        .set('Authorization', res.body.token)
        .send(plan_test)
        .expect(201)

    await request(app)
        .post('/suscriptions/create')
        .set('Authorization', res.body.token)
        .send(suscription_test)
        .expect(201);

})

// test('Wipe out all ', async () => {
//     wipeSuscriptions();
//     wipeOpPlans();
//     wipeOpCustomers();
// })


const wipeOpCustomers = function () {

    const openpay = new Openpay(process.env.OPENPAY_MERCHANT_ID, process.env.OPENPAY_PRIVATE_KEY, false);

    // wipeout openpay data
    openpay.customers.list(function (error, customersList) {
        if (error) {
            throw new Error('Error attempt to retrieve customers list:' + error.description)
        } else {
            for (let i = 0; i < customersList.length; i++) {
                openpay.customers.delete(customersList[i].id, function (error) {
                    if (error) {
                        throw new Error('Error attempt to delete customer: ' + error.description);
                    }
                })
            }
        }
    })

}

const wipeOpPlans = function () {
    const openpay = new Openpay(process.env.OPENPAY_MERCHANT_ID, process.env.OPENPAY_PRIVATE_KEY, false);

    openpay.plans.list(function (error, lista) {
        if (error) {
            throw new Error('Error when retrieving plans: ' + error.description);
        }

        for (let i = 0; i < lista.length; i++) {
            planId = lista[i].id
            planStatus = lista[i].status
            if (planStatus === 'active') {
                openpay.plans.delete(planId, function (error) {
                })
            }
        }

    })

}


const wipeSuscriptions = function () {
    const openpay = new Openpay(process.env.OPENPAY_MERCHANT_ID, process.env.OPENPAY_PRIVATE_KEY, false);

    openpay.customers.list(function (error1, customersList) {

        for (let i = 0; i < customersList.length; i++) {

            const customerId = customersList[i].id;

            openpay.customers.subscriptions.list(customerId, function (error2, suscList) {
                for (let x = 0; x < suscList.length; x++) {
                    const suscId = suscList[x].id
                    const suscStatus = suscList[x].status
                    if (suscStatus === 'active') {
                        openpay.customers.subscriptions.delete(customerId, suscId, function (error) {
                        });

                    }
                }
            })
        }
    })

}