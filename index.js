// Run dotenv
require('dotenv').config();

const config = require('./config.json'); 

const Discord = require('discord.js');
const client = new Discord.Client();

const PREFIX = '!';



client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});


client.on('message', function(message){
	//ignore messages which are not starting with prefix or were sent by any bot
	if (!message.content.startsWith(PREFIX) || message.author.bot) return; 

	var srole = message.guild.roles.cache.find(role => role.name === 'Spect8r');
	var gmrole = message.guild.roles.cache.find(role => role.name === '!-Gamemaster-!');

	//create an array with arguments and a constant for the command
	const args = message.content.slice(PREFIX.length).split(' '); 
	const command = args.shift().toLowerCase();
	const mentions = message.mentions.members.array();

	// choose what to do with the command
	if (command === 'start' && message.guild.member(message.author).roles.cache.some(role => role.name === '!-Gamemaster-!')) {

		//check if user provided at least number of mafias
		if (!args.length) {
			return message.channel.send(`You didn't provide any arguments, ${message.author}! \n*Type* **!help** *to get help with commands*`);
		}

		//check if user is in any voice channel
		if(!message.member.voice.channel) {
			return message.channel.send(`${message.author}, you must be in a voice channel to start the game as a Gamemaster.`);
		}

		//define variables for parsing the arguments
		var mafia_number = 0;
		var sheriff_needed = 1;
		var doctor_needed = 0;

		//if only 1 argument parse the number of mafias
		if (args.length === 1){
			mafia_number = parseInt(args[0], 10);

			if (!Number.isInteger(mafia_number)){
				return message.channel.send(`${message.author}, you must provide an integer for the number of mafia(s).`)
			}
		} 

		//if 2 arguments parse the number of mafias and if doctor needed or not
		else if (args.length === 2){
			mafia_number = parseInt(args[0], 10);
			doctor_needed = parseInt(args[1], 10);
			if (!Number.isInteger(mafia_number) || !Number.isInteger(sheriff_needed)){
				return message.channel.send(`${message.author}, you must provide an integer for the number of mafia(s) and 1/0 if you need the doctor or not.`);
			}
		} 

		//if 3 arguments parse the number of mafias, if doctor needed or not and the same for the sheriff
		else if (args.length === 3){
			mafia_number = parseInt(args[0], 10);
			doctor_needed = parseInt(args[1], 10);
			sheriff_needed = parseInt(args[2], 10);
			if (!Number.isInteger(mafia_number) || !Number.isInteger(sheriff_needed) || !Number.isInteger(doctor_needed)){
				return message.channel.send(`${message.author}, you must provide an integer for the number of mafia(s) and 1/0 if you need the doctor or not and the same for the sheriff.`);
			}
		} 

		//if more than 3 arguments tell about it
		else {
			return message.channel.send(`${message.author}, you've provided more arguments than it's needed! \n*Type* **!help** *to get help with commands*`);
		}

		//check if the number of mafias is positive
		if (mafia_number < 1){
			return message.channel.send(`${message.author}, number of mafia(s) must be greater than zero!`);
		} 
		
		if (sheriff_needed > 1){
			sheriff_needed = 1;
		}
		if (doctor_needed > 1){
			doctor_needed = 1;
		}

		//check if there are enough players in the voice channel
		if (message.member.voice.channel.members.array().length < mafia_number*2 + sheriff_needed + doctor_needed){
			return message.channel.send(`${message.author}, not enough players in this voice channel.`)
		}

		//log about start
		message.channel.send(`It's time to kill someone :spy: and have fun! :yum:`)
		//log about game preset
		message.channel.send(`${message.author}, there'll be ${mafia_number} mafia(s), ${sheriff_needed} sheriff(s) and ${doctor_needed} doctor(s).`);
		
		//get an array of the voice channel members excluding the message.author which will be the GM
		var members = message.member.voice.channel.members.array();
		members.splice(members.indexOf(message.guild.member(message.author)), 1);
		var flag = true;
		while (flag){
			for (var i = 0; i < members.length; i++){
				if (members[i].roles.cache.some(role => role.name === 'Spect8r')){
					members.splice(i, 1);
					flag = true;
					break;
				}
				flag = false;
			}
		}

		//shuffle the array of members;
		for(let i = members.length - 1; i > 0; i--){
			const j = Math.floor(Math.random() * i)
			const temp = members[i];
			members[i] = members[j];
			members[j] = temp;
		}
				
		//choose mafia_number of mafias
		var mafias = [];
		for (var i = 0; i < mafia_number; i++){
			mafias.push(members[Math.floor(Math.random() * members.length)]);

			if (i > 0){
				while (mafias[i] === mafias[i-1]){
					mafias[i] = members[Math.floor(Math.random() * members.length)];
				}
			}
		}

		//choose which mafia should become a don
		var don = mafias[Math.floor(Math.random() * mafias.length)];
		var sheriff;
		var doctor;

		//choose 1 sheriff if needed
		if (sheriff_needed === 1){
			sheriff = members[Math.floor(Math.random() * members.length)];
			while (mafias.includes(sheriff)){
				sheriff = members[Math.floor(Math.random() * members.length)];
			}
		}

		//choose 1 doctor if needed
		if (doctor_needed === 1){
			doctor = members[Math.floor(Math.random() * members.length)];
			while (mafias.includes(doctor) || sheriff === doctor){
				doctor = members[Math.floor(Math.random() * members.length)];
			}
		}

		//give numbers to everyone and set as nicknames if possible
		var j = 1;
		for (var i = 0; i < members.length; i++){
			var name = '';
			if (j < 10){
				name = `0${j}`;
			} else {
				name = `${j}`;
			}
			if (members[i] != message.channel.parent.guild.owner){
				members[i].setNickname(name);
			} else {
				message.channel.parent.guild.owner.send(`Your number is ${name}`);
			}
			j++;
		}

		//set nickname for gamemaster if possible
		if (members[i] != message.channel.parent.guild.owner){
			message.guild.member(message.author).setNickname(`999-Gamemaster-666`)
		}

		//send messages with roles
		for (var i = 0; i < mafias.length; i++){
			if (mafias[i] === don){
				don.send(`Your role in this game is "Don"`);
			} else {
				mafias[i].send(`Your role in this game is "Mafia"`);
			}
		}
		if (sheriff_needed === 1){
			sheriff.send(`Your role in this game is "Sheriff"`);
		}
		if (doctor_needed === 1){
			doctor.send(`Your role in this game is "Doctor"`);
		}
		for (var i = 0; i < members.length; i++){
			if (!mafias.includes(members[i]) && members[i] != sheriff && members[i] != doctor){
				members[i].send(`Your role in this game is "Civilian"`);
			}
		}

		//send info about all roles to the gamemaster
		var gmlog = `"Mafia"(s) is/are ${mafias}, "Don" is ${don}`;
		if (sheriff_needed === 1){
			gmlog = gmlog + `, "Sheriff" is ${sheriff}`;
		}
		if (doctor_needed === 1){
			gmlog = gmlog + `, "Doctor" is ${doctor}`;
		}
		message.author.send(gmlog);		
	}

	else if (command === `stop` && message.guild.member(message.author).roles.cache.some(role => role.name === '!-Gamemaster-!')){
		if (message.member.voice.channel){
			var members = message.member.voice.channel.members.array();
			for (var i = 0; i < members.length; i++){
				if(members[i] != message.channel.parent.guild.owner){
					members[i].setNickname(``);
				}
			}
		}
		message.channel.send(`I hope all of you will return here to play again soon! :confused:`)
	}

	else if (command === `help`){
		message.channel.send('This bot has 5 commands:\n**!gamemaster** or **!gm** <mention> - to give someone a role "!-Gamemaster-!" *(only for owner and other GMs)*\n**!help** - to see this message\n**!start** - to start the game *(only for GMs)*\n__Arguments__:\n 1 - ``<mafia_number>`` - *number of mafias in game*\n 2 - ``<doctor_needed>`` - *1 if needed, 0 if not, default = 0* __*optional*__\n 3 - ``<sheriff_needed>`` - *1 if needed, 0 if not, default = 1* __*optional*__\n**!spectate** or **!sp** - to get/lose role "Spect8r"\n**!stop** - to reset nicknames of players *(only for GMs)*');
	} 

	else if (command === 'spectate' || command === 'sp'){
		const roleName = 'Spect8r';
		const role = message.guild.roles.cache.some(role => role.name === roleName);
		if (!role) {
			message.guild.roles.create({
				data: {
					name: 'Spect8r',
					color: 'BLUE',
				},
				reason: 'we needed a role for spect8rs',
			})
			.then(console.log)
			.catch(console.error);
		}
		//var mrole = message.guild.roles.cache.find(role => role.name === 'Spect8r')
		if (!message.guild.member(message.author).roles.cache.some(role => role.name === 'Spect8r')){
			message.guild.member(message.author).roles.add(srole, 'Used command !spectate');
		}
		else {
			message.guild.member(message.author).roles.remove(srole, 'Used command !spectate');
		}
	}
	else if ((command === 'gm' || command === 'gamemaster') && (message.guild.member(message.author) === message.guild.owner || message.guild.member(message.author).roles.cache.some(role => role.name === '!-Gamemaster-!'))){
		const roleName = '!-Gamemaster-!';
		const role = message.guild.roles.cache.some(role => role.name === roleName);
		if (!role) {
			message.guild.roles.create({
				data: {
					name: '!-Gamemaster-!',
					color: 'RED',
				},
				reason: 'we needed a role for gamemasters',
			})
			.then(console.log)
			.catch(console.error);
		}
		//var mrole = message.guild.roles.cache.find(role => role.name === '!-Gamemaster-!')
		if (mentions){
			for (var i = 0; i < mentions.length; i++){
				if (!mentions[i].roles.cache.some(role => role.name === '!-Gamemaster-!')){
					mentions[i].roles.add(gmrole, `${message.author} used command !gm or !gamemaster`);
				}
				else {
					mentions[i].roles.remove(gmrole, `${message.author} used command !gm or !gamemaster`);
				}
			}
		} else	{
			message.reply(`You must mention person(s) for which you'd like to switch the role !-Gamemaster-!`);
		}
		
	}

})


client.login(process.env.DISCORD_TOKEN);


/*
Если сообщение начинается с !start, найти в строке ch: <channel>, <mafia-number>, <sheriff-needed> (0,1), <doctor-needed> (0,1), spect8: <sp1-mention>, <sp2-mention>, ..., <spN-mention>
После чего сменить имена всех игроков в канале ch кроме отправителя сообщения и spect8 на числа от 01 до их кол-ва. отправителю поставить "Game-master".
Далее распределить роли рандомом среди людей с номерными именами в канале, и отправить роли в лс (игрокам - их, ведущему - все).

Если сообщение содержит !stop, убрать номерные имена. */
