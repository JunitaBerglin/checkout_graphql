let vaseList = [];

window.onload = function () {
  handleGetListButtonClick();
  handleHideListButtonClick();
  handleSubmit();
};

/*-------------------------------------------- BOILER PLATE ---------------------------------------------*/

//för vår fetch
//graphQlQuery är ju en async function helt enkelt som vi skickar in olika parametrar in beroende på om vi vill göra en query eller mutation?
//Syfte:låter oss återanvända fetch lättare  //koden för att göra vår fetch för att sen kunna bara skicka in en variabel
const graphQlQuery = async (url, query, variables = {}) => {
  //url till servern där vi har vårt graphql api (skapat av vår apollo server (verktyg) //parametrar som måste heta så här iom bodyn innehåll nedan
  const response = await fetch(url, {
    method: "POST", //vi gör alltid postrequest till ett graphql-api //kan därav ha reusable function //syntax för detta finns i en slide från lektion i v.2
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query, //utbytbart för olika requests
      variables, //utbytbart för olika requests
    }),
  });

  const res = await response.json();
  return res.data;
};

/*-------------------------------------------- FÖR QUERY ---------------------------------------------*/

//Syfte: se nedan
//Vi skapar en query-variabel som innehåller typ syntax för hur en query ser ut i apollo server - och som matchar vår query i vårt schema
//Denna syntax kan man hitta (och copy-pastea om man vill) i sin graphql playground på apollo server (om man inte kan det i huvudet).
//textsträng som skickas till graphql för tolkning - följer därav syntax
//1. query - vi ska göra en query, -optional att skriva getAllHiddenGems efter, som samlingsnamn för queries i bodyn
//2. andra getAllHiddenGems är namnet på resolvern vi vill ha
//3. fälten vi vill ha tillbaka
const getAllVasesQuery = `query getAllVases {
    getAllVases {
      id
      name
      unitPrice
    }
  }`;

async function handleGetListButtonClick() {
  // Nu hämtar vi o lyssnar på knappen som ska visa listan, och inne i anonyma funktionen på vår addEventListener:
  // - awaitar vi inbyggda funktionen graphQLQuery (och skickar med url:en, samt query-variabeln vi nyss skapade.
  // - vi skapar även en variabel för att fånga upp ett objekt i vår response, nämligen listan vi får tillbaka
  // - Sist så anropar vi createHTML med denna lista.
  const getListBtn = document.getElementById("getListBtn");

  getListBtn.addEventListener("click", async () => {
    const response = await graphQlQuery(
      "http://localhost:5001/graphql",
      getAllVasesQuery
    );

    // console.log(response);

    vaseList = response.getAllVases;

    createHTML(vaseList);
  });
} /*
function createHTML(vaseList) {

  for (let i = 0; index < vaseList.length; i++) {
    
  
  let listWrapper = document.createElement("div");

  listWrapper.innerHTML = 

},
}*/
