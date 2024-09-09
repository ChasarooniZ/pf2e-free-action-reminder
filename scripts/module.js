Hooks.once('init', async function () {

});

Hooks.once('ready', async function () {
    if (!game.user.isGM) return
    Hooks.on("pf2e.startTurn", pf2eStartTurn);
    Hooks.on("combatStart", combatStart);
});


export async function pf2eStartTurn(combatant, encounter, _userID) {
    const actor = combatant.token.actor;
    const reminders = checkActorForReminders(actor, "startTurn", { round: encounter.round })
    if (reminder.length) {
        createReminder([{ actor, reminders }])
    }
}


export async function combatStart(encounter, _current) {
    const reminderList = []
    for (const combatant of encounter.turns) {
        const actor = combatant.token.actor;
        const reminders = checkActorForReminders(actor, "startCombat");
        if (reminder.length) {
            reminderList.push({ actor, reminders });
        }
    }
    if (reminderList.length) {
        createReminder(reminderList);
    }
}

function checkActorForReminders(actor, reason, config = {}) {
    const slugs = actor.items.map(i => i.slug);
    const list = []
    const exploration = actor.system?.exploration?.map(e => actor.items.get(e).slug);
    switch (reason) {
        case "startCombat":
            //Battle Cry
            if (slugs.includes("battle-cry")) {
                list.push({
                    action: "Compendium.pf2e.actionspf2e.Item.2u915NdUyQan6uKF",
                    source: "Compendium.pf2e.feats-srd.Item.ePObIpaJDgDb9CQj"
                })
            }
            // Defend
            if (exploration.includes("defend")) {
                list.push({
                    action: "Compendium.pf2e.actionspf2e.Item.xjGwis0uaC2305pm",
                    source: "Compendium.pf2e.actionspf2e.Item.cYtYKa1gDEl7y2N0"
                })
            }
            //Oracle: Oracular Warning
            if (slugs.includes("oracular-warning")) {
                list.push({
                    action: "Compendium.pf2e.feats-srd.Item.Gcliatty0MGYbTVV",
                    source: "Compendium.pf2e.feats-srd.Item.Gcliatty0MGYbTVV"
                })
            }

            break;
        case "startTurn":
            //Gunslinger: Ten Paces
            if (slugs.includes("ten-paces") && config?.round === 1) {
                list.push({
                    action: "Compendium.pf2e.actionspf2e.EeM0Czaep7G5ZSh5",
                    source: "Compendium.pf2e.classfeatures.Item.qRLRrHf0kzaJ7xt0"
                })
            }
            // Investigate Free Recall Knowledge Homebrew
            if (exploration.includes("investigate") && config?.round === 1) {
                list.push({
                    action: "Compendium.pf2e.actionspf2e.Item.1OagaWtBpVXExToo",
                    source: "Compendium.pf2e.actionspf2e.Item.EwgTZBWsc8qKaViP"
                })
            }
            //Prone + Kip Up
            if (actor.conditions.active.some(c => c.slug === "prone") && slugs.includes("kip-up")) {
                list.push({
                    action: "Compendium.pf2e.actionspf2e.Item.OdIUybJ3ddfL7wzj",
                    source: "Compendium.pf2e.feats-srd.Item.gBSPbQRXdagZTUwY"
                })
            }
            // Thaumaturge: Tome (Adept)
            if (actor?.flags?.pf2e?.rollOptions?.all["adept:tome"]) {
                list.push({
                    action: "Compendium.pf2e.actionspf2e.1OagaWtBpVXExToo",
                    source: "Compendium.pf2e.classfeatures.MyN1cQgE0HsLF20e"
                })
            }

            break;
    }
    return list;
}


/**
 * 
 * @param {{actor, reminders: [{action: any, source: any}]}[]} reminderList 
 */
function createReminder(reminderList) {
    for (const reminder of reminderList) {
        const list = reminder.reminders.map(r => `<tr>
        <td>@UUID[${r.action}]</td>
        <td>@UUID[${r.source}]</td>
      </tr>`)
        ChatMessage.create({
            content: `<h3>Action Reminder</h3>
            <table>
            <thead>
                <tr>
                <th scope="col">Action</th>
                <th scope="col">Source</th>
                </tr>
            </thead>
            <tbody>
                ${list.join("")}
            </tbody>
            </table>`,
            whisper: getMessageList(reminder.actor)
        })
    }
}

function getMessageList(actor) {
    const ownership = actor.ownership;
    if (ownership?.default >= 3) {
        return [...ChatMessage.getWhisperRecipients("players"), ...ChatMessage.getWhisperRecipients("GM")]
    } else {
        const actList = ChatMessage.getWhisperRecipients(actor.name);
        if (actList.length === 0) ChatMessage.getWhisperRecipients("GM");
    }
}