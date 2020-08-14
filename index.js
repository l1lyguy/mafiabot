// Run dotenv
require('dotenv').config();

//const config = require('./config.json'); 

const Discord = require('discord.js');
const client = new Discord.Client();

const PREFIX = '!';

//list of the supported languages
var langs = ["ru", "en", "de", "tt"];


client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

function create_role(message, roleName, color, reason){
	message.guild.roles.create({
		data: {
			name: roleName,
			color: color,
		},
		reason: reason,
	})
	.catch(console.error);

}

client.on('message', async function(message){
	//ignore messages which are not starting with prefix or were sent by any bot
	if (!message.content.startsWith(PREFIX) || message.author.bot) return;
	var lang = 'en';
	
	if (message.guild.me.roles.cache.some(role => role.name === 'RU')) {
		lang = 'ru';
	}
	if (message.guild.me.roles.cache.some(role => role.name === 'EN')) {
		lang = 'en';
	}
	//if (message.guild.me.roles.cache.some(role => role.name === 'DE')) {
	//	lang = 'de';
	//}

	var file = './localization/' + lang + '.json';
	var msg_json = require(file);

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
			return message.channel.send(msg_json.err_start_no_args_pt1 + `${message.author}` + msg_json.err_start_no_args_pt2);
		}

		//check if user is in any voice channel
		if(!message.member.voice.channel) {
			return message.channel.send(`${message.author}` + msg_json.err_start_no_vc);
		}

		//define variables for parsing the arguments
		var mafia_number = 0;
		var sheriff_needed = 1;
		var doctor_needed = 0;

		//if only 1 argument parse the number of mafias
		if (args.length === 1){
			mafia_number = parseInt(args[0], 10);

			if (!Number.isInteger(mafia_number)){
				return message.channel.send(msg_json.err_start_not_int1)
			}
		} 

		//if 2 arguments parse the number of mafias and if doctor needed or not
		else if (args.length === 2){
			mafia_number = parseInt(args[0], 10);
			doctor_needed = parseInt(args[1], 10);
			if (!Number.isInteger(mafia_number) || !Number.isInteger(sheriff_needed)){
				return message.channel.send(`${message.author}` + msg_json.err_start_not_int2);
			}
		} 

		//if 3 arguments parse the number of mafias, if doctor needed or not and the same for the sheriff
		else if (args.length === 3){
			mafia_number = parseInt(args[0], 10);
			doctor_needed = parseInt(args[1], 10);
			sheriff_needed = parseInt(args[2], 10);
			if (!Number.isInteger(mafia_number) || !Number.isInteger(sheriff_needed) || !Number.isInteger(doctor_needed)){
				return message.channel.send(`${message.author}` + msg_json.err_start_not_int3);
			}
		} 

		//if more than 3 arguments tell about it
		else {
			return message.channel.send(`${message.author}` + msg_json.err_more_args);
		}

		//check if the number of mafias is positive
		if (mafia_number < 1){
			return message.channel.send(`${message.author}` + msg_json.err_start_no_mafia);
		} 
		
		if (sheriff_needed > 1){
			sheriff_needed = 1;
		}
		if (doctor_needed > 1){
			doctor_needed = 1;
		}

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

		//check if there are enough players in the voice channel
		if (members.length < mafia_number*2 + sheriff_needed + doctor_needed){
			return message.channel.send(`${message.author}` + msg_json.err_start_no_players);
		}

		//log about start
		message.channel.send(msg_json.log_start);
		//log about game preset
		message.channel.send(`${message.author}` + msg_json.log_game_preset_pt1 + `${mafia_number}` + msg_json.log_game_preset_pt2 + `${sheriff_needed}` + msg_json.log_game_preset_pt3 + `${doctor_needed}` + msg_json.log_game_preset_pt4);
		
		//shuffle the array of members;
		members.sort(() => Math.random() - 0.5);
				
		//choose mafia_number of mafias
		var mafias = [];
		for (var i = 0; i < mafia_number; i++){
			var random_person = members[Math.floor(Math.random() * members.length)]
			
			//fix bug
			if (i > 0){
				while (mafias.includes(random_person)){
					random_person = members[Math.floor(Math.random() * members.length)];
				}
			}
			mafias.push(random_person);
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

		//give numbers to everyone and set nicknames if possible
		var j = 1;
		for (var i = 0; i < members.length; i++){
			var name = members[i].nickname;
			if (j < 10){
				if (name != null){
					name = `#0${j} | ` + name;
				}
				else {
					name = `#0${j} | ` + members[i].user.username;
				}
			} else {
				if (name != null){
					name = `#${j} | ` + name;
				}
				else {
					name = `#${j} | ` + members[i].user.username;
				}
			}
			if (members[i] != message.guild.owner){
				await members[i].setNickname(name).catch();
			} else {
				await message.guild.owner.send(msg_json.msg_gm_number + `${j}`);
			}
			j++;
		}

		//set nickname for gamemaster if possible
		if (message.guild.member(message.author) != message.guild.owner){
			var name = message.guild.member(message.author).nickname;
			if (name === null) {
				name = message.guild.member(message.author).user.username;
			}
			await message.guild.member(message.author).setNickname(`Gamemaster | ` + name).catch();
		}

		//send messages with roles
		for (var i = 0; i < mafias.length; i++){
			if (mafias[i] === don){
				don.send(msg_json.msg_role_dn);
			} else {
				mafias[i].send(msg_json.msg_role_mf);
			}
		}
		if (sheriff_needed === 1){
			sheriff.send(msg_json.msg_role_sh);
		}
		if (doctor_needed === 1){
			doctor.send(msg_json.msg_role_dc);
		}
		for (var i = 0; i < members.length; i++){
			if (!mafias.includes(members[i]) && members[i] != sheriff && members[i] != doctor){
				members[i].send(msg_json.msg_role_cv);
			}
		}

		//send info about all roles to the gamemaster
		var gmlog = msg_json.msg_gmlog_base_pt1 + `${mafias}` + msg_json.msg_gmlog_base_pt2 + `${don}`;
		if (sheriff_needed === 1){
			gmlog = gmlog + msg_json.msg_gmlog_sh +`${sheriff}`;
		}
		if (doctor_needed === 1){
			gmlog = gmlog + msg_json.msg_gmlog_dc + `${doctor}`;
		}
		message.author.send(gmlog);		
	}

	// if game stopped return usual names to users which are still in voice channel
	else if (command === `stop` && message.guild.member(message.author).roles.cache.some(role => role.name === '!-Gamemaster-!')){
		if (message.member.voice.channel){
			var members = message.member.voice.channel.members.array();
			for (var i = 0; i < members.length; i++){
				if(members[i] != message.channel.parent.guild.owner && members[i].nickname.includes('#') && members[i].nickname.includes(' | ')){
					var new_name = members[i].nickname;
					new_name = new_name.slice(6, new_name.length);
					members[i].setNickname(new_name).catch();
				}
				else if(members[i] != message.channel.parent.guild.owner && members[i].nickname.includes('Gamemaster | ')){
					var new_name = members[i].nickname;
					new_name = new_name.slice(13, new_name.length);
					members[i].setNickname(new_name).catch();
				}
			}
		}
		message.channel.send(msg_json.log_stop);
	}

	//display help message
	else if (command === `help`){
		message.channel.send(msg_json.help);
	} 

	//give spectator's role to the message author to let him stay in channel and still don't break the setup
	else if (command === 'spectate' || command === 'sp'){
		const roleName = 'Spect8r';
		const color = 'BLUE';
		const role = message.guild.roles.cache.some(role => role.name === roleName);
		
		//create role if it doesn't exists and refresh roles collection for new information;
		if (!role) {
			create_role(message, roleName, color, msg_json.role_sp_cr_reason);
			await message.guild.roles.fetch();
			srole = message.guild.roles.cache.find(role => role.name === roleName);
		}

		//give role to author if he doesn't have it and remove in other case
		if (!message.guild.member(message.author).roles.cache.some(role => role.name === 'Spect8r')){
			message.guild.member(message.author).roles.add(srole, msg_json.role_sp_sw_reason)
			.catch(console.error);
		}
		else {
			message.guild.member(message.author).roles.remove(srole, msg_json.role_sp_sw_reason);
		}
	}

	//give gamemaster's role to the people which are mentioned in the message
	else if ((command === 'gm' || command === 'gamemaster') && (message.guild.member(message.author) === message.guild.owner || message.guild.member(message.author).roles.cache.some(role => role.name === '!-Gamemaster-!'))){
		const roleName = '!-Gamemaster-!';
		const color = 'RED';
		const role = message.guild.roles.cache.some(role => role.name === roleName);
		//create role if it doesn't exists and refresh roles collection for new information;
		if (!role) {
			create_role(message, roleName, color, msg_json.role_gm_cr_reason);
			await message.guild.roles.fetch();
			gmrole = message.guild.roles.cache.find(role => role.name === roleName)
		}

		// give role to those of mentioned people who doesn't have it and remove for others
		if (mentions.length > 0){
			for (var i = 0; i < mentions.length; i++){
				if (!mentions[i].roles.cache.some(role => role.name === '!-Gamemaster-!')){
					mentions[i].roles.add(gmrole, `${message.author}` + msg_json.role_gm_sw_reason)
					.catch(console.error);
				}
				else {
					mentions[i].roles.remove(gmrole, `${message.author}` + msg_json.role_gm_sw_reason);
				}
			}
		} else	{
			message.reply(msg_json.err_gm_no_args);
		}		
	}

	//switch bot's language
	else if ((command === 'lang' || command === 'language') && (message.guild.member(message.author) === message.guild.owner)) {
		if (!args.length){
			return message.channel.send(msg_json.err_lang_no_args);
		}

		//create role for the language if it's supported
		if (args.length === 1 && langs.includes(args[0].toLowerCase())){
			const roleName = args[0].toUpperCase();
			const color = "#95a5a6";
			var role_add = message.guild.roles.cache.find(role => role.name === roleName);
			var mrole = message.guild.roles.cache.some(role => role.name === roleName);
			if (!mrole){
				create_role(message, roleName, color, msg_json.role_lang_cr_reason + roleName);
				await message.guild.roles.fetch();
				role_add = message.guild.roles.cache.find(role => role.name === roleName);
			}

			//if bot doesn't have this role just remove roles of other languages and give this one
			if (!message.guild.me.roles.cache.some(role => role.name === roleName)){
				var role_rm = 0;

				for (var i = 0; i < langs.length; i++){
					if (message.guild.me.roles.cache.some(role => role.name === langs[i].toUpperCase())){
						role_rm = message.guild.roles.cache.find(role => role.name === langs[i].toUpperCase());
						message.guild.me.roles.remove(role_rm, `${message.guild.owner} switched the language to ` + langs[i].toUpperCase());
					}
				}

				message.guild.me.roles.add(role_add, `${message.guild.owner} switched the language to ` + roleName)
				.catch(console.error);
			}			
		}
		else if (args.length === 1){
			return message.channel.send(`${message.author}` + msg_json.err_lang_unknown);
		}
		else {
			return message.channel.send(`${message.author}` + msg_json.err_more_args);
		}
	}

	else if ((command === 'languages') || (command === 'langs') && message.guild.member(message.author) === message.guild.owner) {
		if (args.length === 0){
			var my_string = msg_json.langs_base_string;
			for (var i = 0; i < langs.length; i++) {
				my_string += langs[i].toUpperCase() + "\n";
			}
			return message.channel.send(my_string);
		}
		else {
			return message.channel.send(`${message.author}` + msg_json.err_more_args)
		}
	}
})

client.login(process.env.DISCORD_TOKEN);

/*
Если сообщение начинается с !start, найти в строке ch: <channel>, <mafia-number>, <sheriff-needed> (0,1), <doctor-needed> (0,1), spect8: <sp1-mention>, <sp2-mention>, ..., <spN-mention>
После чего сменить имена всех игроков в канале ch кроме отправителя сообщения и spect8 на числа от 01 до их кол-ва. отправителю поставить "Game-master".
Далее распределить роли рандомом среди людей с номерными именами в канале, и отправить роли в лс (игрокам - их, ведущему - все).

Если сообщение содержит !stop, убрать номерные имена. */
