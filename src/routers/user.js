const express = require("express");
const router = new express.Router();
const User = require("../model/user");
const Order = require("../model/order");
const Notification = require("../model/notification");
const Signup = require("../model/signup");
const auth = require("../middleware/auth");
const moment = require("moment");
const multer = require("multer"); // parar cargar imagenes
const sharp = require("sharp");

const axios = require("axios");

const {
  sendWelcomeEmail,
  sendGoodbyEmail,
  sendConfirmationEmail,
} = require("../emails/account");
const sendWelcomeSMS = require("../sms/sendsms");
const passwordGenerator = require("../utils/codegenerator");

router.post("/users/signup", async (req, res) => {
  const code = passwordGenerator(10);

  try {
    const signup = new Signup({ code, ...req.body });
    await signup.save();

    sendConfirmationEmail(req.body.email, req.body.name, code)
    res.status(201).send({
      signup: {
        name: signup.name,
        lastname: signup.lastname,
        email: signup.email,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});

router.post("/users/create/:signup_code", async (req, res) => {
  // crea un nuevo usuario
  try {
    const signup = await Signup.findOne({ code: req.params.signup_code });
    if (!signup) {
      throw new Error("Not able to find the confirmation code");
    }
    if (signup.code !== req.params.signup_code) {
      throw new Error("Not able to find the confirmation code");
    }
    // calculate 20 minutes of time to live for the signup code
    const createdTime = moment(signup.createdAt);
    const now = moment();
    ttl = now - createdTime;
    if (ttl > 1200000) {
      throw new Error("Confirmation code has expired!");
    }
    const user = new User({
      name: signup.name,
      lastname: signup.lastname,
      email: signup.email,
      password: signup.password,
    });

    const token = await user.generateAuthToken();
    await user.save();
    sendWelcomeEmail(user.email, user.name)

    res.status(201).send({ user, token });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.post("/users/plans", auth, async (req, res) => {
  // endpoint to create paypal plans for the customer
  /// Paypal Access Token
  try {
    const api = axios.create({
      baseURL: process.env.PAYPAL_URL,
      headers: { Authorization: `Bearer ${req.currentPaypalToken}` },
    });

    const cart = req.user.cart;

    const paypalRes = await api.post("/v1/billing/plans", {
      product_id: cart.product.paypal_product_id,
      name: `Service pack ${cart.product.short_name}`,
      description: `12 months suscription for ${cart.product.short_name} pack`,
      billing_cycles: [
        {
          frequency: {
            interval_unit: "MONTH",
            interval_count: 1,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 12,
          pricing_scheme: {
            fixed_price: {
              value: cart.summary.total,
              currency_code: "USD",
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    });

    const order = new Order({
      user_id: req.user._id,
      cart: req.user.cart,
      plan: paypalRes.data,
    });

    await order.save();

    res.send(paypalRes.data);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

/// Get transactions from a suscriptionID
router.get("/users/transactions/:subscriptionID", auth, async (req, res) => {
  try {

    const api = axios.create({
      baseURL: process.env.PAYPAL_URL,
      headers: { Authorization: `Bearer ${req.currentPaypalToken}` },
    });
    
    const paypalRes = await api.get(`/v1/billing/subscriptions/${req.params.subscriptionID}/transactions?start_time=2018-01-21T07:50:20.940Z&end_time=2030-08-21T07:50:20.940Z`);
    
    if( req.query.transactionID )
    {
      const oneTrx = paypalRes.data.transactions.find( i => i.id === req.query.transactionID)
      res.send(oneTrx);
    }
    else
      res.send(paypalRes.data);

  } catch (error) {
    console.log(error);
    res.status(401).send(error);
  }
});

router.patch("/users/orders/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id });

    if (!order) {
      throw new Error("Not able to find the order to update");
    }

    const properties = Object.keys(req.body);

    properties.forEach((valor) => (order[valor] = req.body[valor]));

    await order.save();
    res.status(200).send(order);
  } catch (error) {
    res.status(401).send(error);
  }
});

router.get("/users/orders", auth, async (req, res) => {
  const match = {
    user_id: req.user._id,
  };

  try {
    if (req.query.planid) {
      match["user_id"] = req.user._id;
      match["plan.id"] = req.query.planid;
    }
    if( req.query.subscriptionID ){
      match["user_id"] = req.user._id;
      match["subscription.subscriptionID"] = req.query.subscriptionID
    }
    const orders = await Order.find(match);
    res.send(orders);
  } catch (error) {
    res.status(500).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.post("/notifications", async (req, res) => {
  try {
    const noti = new Notification({ data: req.body });
    await noti.save();
  } catch (error) {
    res.status(401).send();
  }

  res.status(200).send();
});

router.patch("/users/me", auth, async (req, res) => {
  // PATCH (actualiza) usuario

  const actualizaciones = Object.keys(req.body);
  const camposPermitidos = ["name", "email", "password", "lastname", "cart"];

  if (!isComparaArreglosJSON(actualizaciones, camposPermitidos)) {
    return res
      .status(400)
      .send({ error: "Body includes invalid properties..." });
  }

  try {
    actualizaciones.forEach((valor) => (req.user[valor] = req.body[valor]));

    await req.user.save();
    res.status(200).send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  // elimina mi usuario (quien esta logeado)

  try {
    await req.user.remove();

    // sendGoodbyEmail(req.user.email,req.user.name)

    return res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  // Enviar peticion Login, generar un nuevo token

  try {
    const user = await User.findUserByCredentials(
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthToken();

    res.send({ user: user, token });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/users/logout", auth, async (req, res) => {
  // Enviar peticion de Logout, elimina el token actual

  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.currentToken;
    });

    await req.user.save();
    res.send();
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
});

router.post("/users/logoutall", auth, async (req, res) => {
  // Envia peticion de Logout de todos los tokens generados, elimina todos los tokens

  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

const upload = multer({
  //dest: 'avatars', commentado para evitar que envie el archivo sea enviado a la carpeta avatars
  limits: {
    fileSize: 1000000, // 1,0 megabytes
  },
  fileFilter(req, file, cb) {
    // cb -> callback function

    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      // Expresion regular-> checar regex101.com
      return cb(new Error("Not a valid image.. use only PNG, JPEG, JPG"));
    }

    cb(undefined, true);
    // cb( new Error('file type in not accepted') )
    // cb( undefined, true )
    // cb( undefined, false )
  },
});

// POST actualizar imagen avater del usuario autenticado
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();

    req.user.selfi = buffer;

    await req.user.save();

    res.send();
  },
  (error, req, res, next) => {
    // handle error while loading upload
    res.status(400).send({ error: error.message });
  }
);

// DELETE elminar el avatar del usuario autenticado
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();

  res.send();
});

// GET obtener el avatar de cualquier usuario (sin estar logeado)
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png"); // respues en modo imagen desde el server
    res.send(user.avatar); // send -> campo buffer
  } catch (error) {
    res.status(404).send();
  }
});

const MessagingResponse = require("twilio").twiml.MessagingResponse;

router.post("/sms", (req, res) => {
  const twiml = new MessagingResponse();

  twiml.message("Codigo de acceso 103456 expira en 5 minutos");

  res.set("Content-Type", "text/xml");
  res.send(twiml.toString());
});

const isComparaArreglosJSON = (origen, destino) => {
  const resultadoLogico = origen.every((actual) => destino.includes(actual));
  return resultadoLogico;
};

module.exports = router;
