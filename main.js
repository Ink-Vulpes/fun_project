const summoner_name = document.getElementById('summoner_name');
const commit_button = document.getElementById('commit_button');
const riot_api = document.getElementById('riot_api');
const error_text = document.getElementById('error_text');
const finish_text = document.getElementById('finish_text');
const region = document.getElementById('region');
const lp_on_win = document.getElementById('lp_on_win');
const lp_on_lose = document.getElementById('lp_on_lose');
const goal_lp = document.getElementById('goal_lp');

commit_button.addEventListener('click', async () => {
    if (summoner_name.value === '') {
        error_text.innerHTML = 'Please enter a summoner name';
        return;
    }
    if (riot_api.value === '') {
        error_text.innerHTML = 'Please enter a Riot API key';
        return;
    }

    const game_name = encodeURIComponent(summoner_name.value.split('#')[0]);
    const game_tag = summoner_name.value.split('#')[1];

    const uuid_rest_url = `https://${region.value}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${game_name}/${game_tag}?api_key=${riot_api.value}`;

    const uuid_response = await fetch(uuid_rest_url);

    if (!uuid_response.ok) {
        error_text.innerHTML = 'Error fetching UUID';
        return;
    }

    const uuid_json = await uuid_response.json();
    const uuid = uuid_json.puuid;

    const match_history_ids_rest_url = `https://${region.value}.api.riotgames.com/lol/match/v5/matches/by-puuid/${uuid}/ids?type=ranked&start=0&count=20&api_key=${riot_api.value}`;
    const match_history_ids_response = await fetch(match_history_ids_rest_url);

    if (!match_history_ids_response.ok) {
        error_text.innerHTML = 'Error fetching match history';
        return;
    }

    const match_history_ids = await match_history_ids_response.json();

    var matches = [];
    var wins = 0;
    var losses = 0;

    for (var i = 0; i < match_history_ids.length; i++) {
        const match_rest_url = `https://${region.value}.api.riotgames.com/lol/match/v5/matches/${match_history_ids[i]}?api_key=${riot_api.value}`;
        const match_response = await fetch(match_rest_url);
        if (!match_response.ok) {
            error_text.innerHTML = 'Error fetching match';
            return;
        }
        const match_json = await match_response.json();
        matches.push(match_json);
        if (analyzeMatch(match_json, uuid)) wins++
        else losses++;
    }

    const win_rate = wins / (wins + losses) * 100;

    const goal_lp_value = (goal_lp.value * 100) / ((win_rate * lp_on_win.value) - ((100 - win_rate) * lp_on_lose.value));

    if (goal_lp_value < 0) {
        error_text.innerHTML = 'Goal LP is not achievable, please lower your goal LP or increase your win rate of ' + win_rate + '%';
        return;
    } else {
        finish_text.innerHTML = `You need to win ${goal_lp_value} games to reach ${goal_lp.value} LP`;
    }


})


function analyzeMatch(match, puuid) {
    for (var player_index = 0; player_index < match.info.participants.length; player_index++) {
        const player = match.info.participants[player_index];
        if (player.puuid !== puuid) continue;
        return player.win;
    }
}