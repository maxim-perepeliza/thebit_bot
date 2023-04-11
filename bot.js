require("dotenv").config();
const fetch = require('node-fetch');
const { Telegraf } = require("telegraf");

// Создать бота с полученным ключом
const bot = new Telegraf(process.env.TELEGRAM_TOKEN_EDU);

const express = require('express')
const app = express()
const PORT = process.env.PORT || 80

const checkAssignStatus = async function (userId) {
    console.log('checkAssignStatus')

    let response = await fetch(`${process.env.API_URL}/check_telegram_user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            userId
        })
    }).catch((error) => {
        console.error('Error log response:', error);
    });

    return response;
}

const assignEmail = async function (userId, email) {
    console.log('assignEmail')

    let response = await fetch(`${process.env.API_URL}/assign_telegram_user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            userId,
            email
        })
    }).catch((error) => {
        console.error('Error log response:', error);
    });

    return response;
}

const unassignUser = async function (userId) {
    console.log('unassignUser')

    let response = await fetch(`${process.env.API_URL}/unassign_telegram_user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            userId
        })
    })
        .then(res => {
            let responseData = JSON.parse(res.data);
            return responseData;
        })
        .catch((error) => {
            console.error('Error log response:', error);
        });

    console.log(response)

    return response;
}

app.get('/', (req, res) => {
    res.end('<p>Home Bot</p>')
})

// Обработчик начала диалога с ботом
bot.start((ctx) => {
    return ctx.reply(
        `Hi ${ctx.from.username ? ctx.from.username : "Man"}, here you can verify you account!\n Run command /start_verify and send email for verifying.`
    );
});

// Обработчик команды /help
bot.help((ctx) => ctx.reply("Run command /start_verify and send email for verifying"));

bot.command("start_verify", (ctx) => {
    return ctx.reply('Send the email with which you are registered on the site');
});

// On handlers
bot.on("callback_query", (ctx) => {
    let branch = ctx.callbackQuery.data;
    let userId = ctx.from.id;
    if (branch == 'unassign_telegram') {

        let userUnassignStatus = unassignUser(userId);

        if (userUnassignStatus.status === 'success') {
            responseMessage = 'Successfully unassigned.';
        } else {
            responseMessage = 'Something went wrong. We will try to fix it ASAP.';
        }
        return ctx.reply(responseMessage);

    } else {
        return ctx.reply(`Selected option : ${ctx.callbackQuery.data}`);
    }

});

// Обработчик простого текста
bot.on("text", (ctx) => {
    let userId = ctx.from.id;
    let responseMessage = 'Something went wrong. We will try to fix it ASAP.';

    let email = ctx.message.text;
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return ctx.reply('Invalid email address');
    }

    let userAlreadyAssigned = checkAssignStatus(userId);

    if (userAlreadyAssigned.status === 'assigned') {
        return ctx.telegram.sendMessage(userId, `This telegram account already assigned to email ${userAlreadyAssigned.email}`, {
            reply_markup: {
                resize_keyboard: true,
                inline_keyboard: [
                    [{ text: "Unassign", callback_data: "unassign_telegram" }]
                ],
            },
        });
    } else {
        let assignResult = assignEmail(userId, email);
        if (assignResult.status === 'success') {
            responseMessage = 'Email successfully verified. This telegram account is assigned to entered email.';
        }
    }

    return ctx.reply(responseMessage);
});



// Запуск бота
bot.launch().then(() => console.log("It's alive!"))

app.listen(PORT, () => {
    console.log('Server works')
})