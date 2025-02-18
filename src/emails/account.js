
const sgMail = require('@sendgrid/mail')
const axios = require("axios");

sgMail.setApiKey(process.env.SENDGRID_API_KEY)


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