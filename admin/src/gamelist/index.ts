import {
  GameBase,
  MESSAGE_TYPE,
  constructMessage,
  parseMessage,
  GameOnlineMessage,
  MatchId,
} from '@kenrick95/c4/src/game'

const C4_SERVER_ENDPOINT =
  process.env.NODE_ENV === 'production'
    ? process.env.C4_SERVER_ENDPOINT
      ? process.env.C4_SERVER_ENDPOINT
      : `wss://c4-server.herokuapp.com/`
    : `ws://${location.hostname}:8080`

export class GameList {
  listElement: HTMLElement;
  gameCheckCoroutine: number;
  ws: null | WebSocket = null;

  currentMatch: MatchId | null;
  emitMap: Function;

  constructor(element: HTMLElement, onMapUpdate: Function) {
    this.listElement = element;
    this.currentMatch = null;
    element.innerText = "FJHSDFHDSFHDKSJFDS";
    this.checkForgames = this.checkForgames.bind(this);
    this.selectGame = this.selectGame.bind(this);
    this.emitMap = onMapUpdate;
    this.setupWS();
  }
  setupWS() {
    if (this.ws) {
      this.ws.close()
    }

    const setStatusDisconnected = () => {
      console.log('GameList: Disconnected from server. This shouldn not happen.');
    }

    this.ws = new WebSocket(C4_SERVER_ENDPOINT, )
    this.ws.addEventListener('message', (event) => {
      const parsed = JSON.parse(event.data).payload.matches;
      this.constructGameList(parsed);
      if (this.currentMatch) {
        this.updateMatch(parsed);
      }

      //this.messageActionHandler(parseMessage(event.data))
    });
    this.ws.addEventListener('open', () => {
      if (this.ws) {
        this.gameCheckCoroutine = window.requestAnimationFrame(this.checkForgames);
        // this.ws.send(
        //   constructMessage(MESSAGE_TYPE.NEW_PLAYER_CONNECTION_REQUEST)
        // )
      }
    });
    //   if (statusboxBodyConnection) {
    //     statusboxBodyConnection.textContent = 'Connected to server'
    //   }
    // })
    this.ws.addEventListener('close', (event) => {
      console.log('[ws] close event', event)
      // setStatusDisconnected()
    })
    // this.ws.addEventListener('error', () => {
    //   console.log('[ws] error event', event)
    //   setStatusDisconnected()
    // })
  }
  checkForgames() {
    if (!this.ws) return;
    /// TODO: add a bool to not send another request until this one is done
    this.ws.send(
      constructMessage(MESSAGE_TYPE.LIST_GAMES)
    );
    setTimeout(() => {
      this.gameCheckCoroutine = window.requestAnimationFrame(this.checkForgames);
    }, 5000);
  }

  updateMatch(matches: Object) {
    if (!matches) return;
    if (!this.currentMatch) return;
    if (!matches[this.currentMatch]) return;
    console.log(matches[this.currentMatch].board);
    if (this.emitMap) this.emitMap(matches[this.currentMatch].board.map);
  }

  selectGame(matchId: MatchId) {
    this.currentMatch = matchId;
    console.log('Selected: ', matchId);
  }

  constructGameList(matches: Object) {
    // console.log(matches);
    // This is all dirty. Maybe consider something like redom?
    this.listElement.innerHTML = ""; // clear all items
    if (!matches) return;
    var template: HTMLTemplateElement | null = document.querySelector('#t-match-row');
    // console.log(template);
    if (!template) return;
    for (const [key, value] of Object.entries(matches)) {
      // console.log(key, value);
      // Clone the new row and insert it into the table
      var clone = template.content.cloneNode(true);

      clone.querySelector('.matchId').innerText = key;
      clone.querySelector('.match-row').addEventListener('click', () => this.selectGame(key));
      // var td = clone.querySelectorAll("td");
      // td[0].textContent = "1235646565";
      // td[1].textContent = "Stuff";

      this.listElement.appendChild(clone);
    }
  }
}