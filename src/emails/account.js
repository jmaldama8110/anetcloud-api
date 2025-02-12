
const sgMail = require('@sendgrid/mail')
const axios = require("axios");

sgMail.setApiKey(process.env.SENDGRID_API_KEY)


const sendConfirmationEmail = ( email, name, code )=>{

    sgMail.send({
        to: email,
        from: 'ANET Cloud<jm@aristanetworks.cloud>',
        subject: `${name} Confirm your email!`,
        text: ` In order to confirm your email, please provide the following code: ${code}`
    })

}

const sendWelcomeEmail = ( email, name )=>{

    sgMail.send({
        to: email,
        from: 'ANET Cloud<jm@aristanetworks.cloud>',
        subject: `${name} Welcome to ANet Cloud!`,
        text: `Thank you, your email has been confirmed!`
    })

}
const sendPaymentLinkEmail = ( email, suscriptionId, paymentUrl )=>{

    sgMail.send({
        to: email,
        from: 'ANET Cloud<jm@aristanetworks.cloud>',
        subject: `A payment link for ${suscriptionId} is waiting to be processed `,
        text: `Please click here to provide your payment ${paymentUrl}`
    })

}

const sendGoodbyEmail = (email, name) =>{

    sgMail.send({
        to: email,
        from: 'ANET Cloud<jm@aristanetworks.cloud>',
        subject: `${name}Sorry to see you go! hopefully we come back soon`,
        text: ` Hi ${name} we are going to miss you!, if theres is something we can do to help you please let us know... We'd loved to get some feedback from you! Hope to see you soon!`
    })

}

async function sendTemplateEmail (data, template_id ) {

    const sendGridApiKey = process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY : "";
    const sendGridApiUrl = "https://api.sendgrid.com";
    
        const api = axios.create({
                method: "post",
                url: "/v3/mail/send",
                baseURL: sendGridApiUrl,
                headers: {
                "content-type": "application/json",
                Authorization: `Bearer ${sendGridApiKey}`,
                },
        });

        // const data = {
        //     email: 'josman.gomez.aldama@gmail.com',
        //     name:'JOSE MANUEL GOMEZ',
        //     subject: 'Welcome',
        //     title: 'Thanks you for suscribing to ANET Cloud',
        //     subtitle: 'Click below to finish your payment process by clicking at the link here:', 
        //     payment_url: 'https://www.aristanetworks.cloud/someowime/9230e920e9u2309e' 
        // }
       
        await new Promise(resolve => setTimeout(resolve, 3000));
        // just for testing in development
        // throw new Error('');
            const res = await api.post("/v3/mail/send", {
                from: { email: "ANET Cloud<jm@aristanetworks.cloud>" },
                subject: data.subject,
                personalizations: [
                {
                    to: [
                    { email: data.email }
                    ],
                        dynamic_template_data: {
                            ...data
                        },
                },
                ],
                template_id,
            });

}


module.exports = {
    sendTemplateEmail
}