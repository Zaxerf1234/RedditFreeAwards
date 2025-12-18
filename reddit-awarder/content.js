const AWARDS = [
	"award_free_mindblown",
	"award_free_popcorn_2",
	"award_free_bravo",
	"award_free_regret_2",
	"award_free_heartwarming"
];

function getCsrfToken() {
	return (document.cookie.match(/csrf_token=([^;]+)/)?.[1]);
}

function sendAward(thingId, awardId) {
	fetch("https://www.reddit.com/svc/shreddit/graphql", {
		credentials: "include",
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			operation: "CreateAwardOrder",
			variables: {input: {nonce: crypto.randomUUID(), thingId, awardId, isAnonymous: false}},
			csrf_token: getCsrfToken()
		})
	})
	.then(r => r.json())
	.then(r => console.log("Awarded", thingId))
	.catch(console.error);
}

function createAwardUI(thingId) {
  const wrap = document.createElement("div");
	wrap.dataset.awardUi = "1";
	wrap.style.display = "inline-flex";
	wrap.style.alignItems = "center";
	wrap.style.gap = "6px";
	wrap.style.marginTop = "6px";
	wrap.style.fontSize = "12px";

	const select = document.createElement("select");
	select.style.fontSize = "12px";

	for (const award of AWARDS) {
		const option = document.createElement("option");
		option.value = award;
		option.textContent = award.replace("award_free_", "");
		select.appendChild(option);
	}

	const button = document.createElement("button");
	button.textContent = "Award";
	button.style.fontSize = "12px";
	button.onclick = () => sendAward(thingId, select.value);

	wrap.append(select, button);
	return wrap;
}

function injectPosts() {
	document.querySelectorAll("shreddit-post").forEach(post => {
		if (post.dataset.awardInjected === "1") return;

		const thingId = post.id;
		if (!thingId?.startsWith("t3_")) return;

		const shareButton = post.querySelector('[slot="ssr-share-button"]');
		if (!shareButton) return;

		shareButton.parentElement.appendChild(createAwardUI(thingId));

		post.dataset.awardInjected = "1";
	});
}

function injectComments() {
	document.querySelectorAll("shreddit-comment").forEach(comment => {
		if (comment.dataset.awardInjected === "1") return;

		const thingId = comment.getAttribute("thingid");
		if (!thingId?.startsWith("t1_")) return;

		const shadow = comment.shadowRoot;
		if (!shadow) return;

		const commentRoot = shadow.querySelector('details[role="article"]');
		if (!commentRoot) return;

		if (commentRoot.querySelector('[data-award-ui="1"]')) {
			comment.dataset.awardInjected = "1";
			return;
		}

		commentRoot.appendChild(createAwardUI(thingId));
		comment.dataset.awardInjected = "1";
	});
}

function run() {
	injectPosts();
	injectComments();
}

run();

new MutationObserver(run).observe(document.body, {
	childList: true,
	subtree: true
});