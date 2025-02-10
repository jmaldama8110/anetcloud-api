
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)


const sendConfirmationEmail = ( email, name, code )=>{

    sgMail.send({
        to: email,
        from: 'jm@aristanetworks.cloud',
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

module.exports = {
    sendConfirmationEmail,
    sendWelcomeEmail,
    sendGoodbyEmail,
    sendPaymentLinkEmail
}