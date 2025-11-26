import { inject, Injectable, signal } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { TokenService } from './token.service';
import { Router } from '@angular/router';

export interface CallInvite {
  callId: string;
  fromUserId: string;  // Caller
  toUserId: string;    // Callee
  fromUsername: string;
}

export interface ActiveCall {
  callId: string;
  peerId: string;
  isCaller: boolean;
}

export interface WebRtcOffer {
  callId: string;
  fromUserId: string;
  sdp: string;
}

export interface WebRtcAnswer {
  callId: string;
  fromUserId: string;
  sdp: string;
}

export interface WebRtcIceCandidate {
  callId: string;
  fromUserId: string;
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export interface CallHangupEvent {
  callId: string;
  fromUserId: string;
}

@Injectable({
  providedIn: 'root',
})
export class CallService {
  private client: Client;
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  callInvite = signal<CallInvite | null>(null);
  activeCall = signal<ActiveCall | null>(null);

  // Letztes empfangenes Signal (pro Typ), CallPage filtert per callId
  incomingOffer = signal<WebRtcOffer | null>(null);
  incomingAnswer = signal<WebRtcAnswer | null>(null);
  incomingIce = signal<WebRtcIceCandidate | null>(null);
  callHangup = signal<CallHangupEvent | null>(null);

  // Handler-Mechanik für CallPage
  private offerHandlers: Array<(offer: WebRtcOffer) => void> = [];
  private answerHandlers: Array<(answer: WebRtcAnswer) => void> = [];
  private iceHandlers: Array<(ice: WebRtcIceCandidate) => void> = [];
  private hangupHandlers: Array<(evt: CallHangupEvent) => void> = [];

  registerOfferHandler(fn: (offer: WebRtcOffer) => void): () => void {
    this.offerHandlers.push(fn);
    return () => {
      this.offerHandlers = this.offerHandlers.filter(h => h !== fn);
    };
  }

  registerAnswerHandler(fn: (answer: WebRtcAnswer) => void): () => void {
    this.answerHandlers.push(fn);
    return () => {
      this.answerHandlers = this.answerHandlers.filter(h => h !== fn);
    };
  }

  registerIceHandler(fn: (ice: WebRtcIceCandidate) => void): () => void {
    this.iceHandlers.push(fn);
    return () => {
      this.iceHandlers = this.iceHandlers.filter(h => h !== fn);
    };
  }

  registerHangupHandler(fn: (evt: CallHangupEvent) => void): () => void {
    this.hangupHandlers.push(fn);
    return () => {
      this.hangupHandlers = this.hangupHandlers.filter(h => h !== fn);
    };
  }

  constructor() {
    this.client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${this.tokenService.getAccessToken() ?? ''}`,
      },
    });

    this.client.onConnect = () => {
      console.log('[STOMP] connected');

      this.client.subscribe('/user/queue/incoming-call', (msg: IMessage) => {
        console.log('[STOMP] incoming-call', msg.body);
        const data: CallInvite = JSON.parse(msg.body);
        this.callInvite.set(data);
      });

      this.client.subscribe('/user/queue/call-accepted', (msg: IMessage) => {
        const data = JSON.parse(msg.body) as { callId: string; accepterId: string };
        console.log('[STOMP] call-accepted', data);
        const current = this.activeCall();
        if (current && current.callId === data.callId) {
          void this.router.navigate(['/call', data.callId]);
        }
      });

      this.client.subscribe('/user/queue/call-rejected', (msg: IMessage) => {
        const data = JSON.parse(msg.body) as { callId: string; rejecterId: string };
        console.log('[STOMP] call-rejected', data);

        const active = this.activeCall();
        if (active && active.callId === data.callId) {
          this.activeCall.set(null);
          void this.router.navigate(['/']);
        }
      });

      this.client.subscribe('/user/queue/call-offer', (msg: IMessage) => {
        const data = JSON.parse(msg.body) as WebRtcOffer;
        console.log('[STOMP] call-offer', data);
        this.incomingOffer.set(data);
        this.offerHandlers.forEach(h => h(data));
      });

      this.client.subscribe('/user/queue/call-answer', (msg: IMessage) => {
        const data = JSON.parse(msg.body) as WebRtcAnswer;
        console.log('[STOMP] call-answer', data);
        this.incomingAnswer.set(data);
        this.answerHandlers.forEach(h => h(data));
      });

      this.client.subscribe('/user/queue/call-ice', (msg: IMessage) => {
        const data = JSON.parse(msg.body) as WebRtcIceCandidate;
        console.log('[STOMP] call-ice', data);
        this.incomingIce.set(data);
        this.iceHandlers.forEach(h => h(data));
      });

      this.client.subscribe('/user/queue/call-hangup', (msg: IMessage) => {
        const data = JSON.parse(msg.body) as CallHangupEvent;
        console.log('[STOMP] call-hangup', data);
        this.callHangup.set(data);
        this.hangupHandlers.forEach(h => h(data));
      });
    };

    this.client.activate();
  }

  // Caller startet Call
  callUser(toUserId: string, callId: string, fromUserId: string, fromUsername: string) {
    console.log('[CallService] callUser', { toUserId, callId, fromUserId, fromUsername });

    this.client.publish({
      destination: '/app/call/invite',
      body: JSON.stringify({ toUserId, callId, fromUserId, fromUsername }),
    });

    this.activeCall.set({
      callId,
      peerId: toUserId,
      isCaller: true,
    });
  }

  setActiveCallAsCallee(callId: string, callerId: string) {
    console.log('[CallService] setActiveCallAsCallee', { callId, callerId });

    this.activeCall.set({
      callId,
      peerId: callerId,
      isCaller: false,
    });
  }

  acceptCall(callId: string, callerId: string) {
    this.client.publish({
      destination: '/app/call/accept',
      body: JSON.stringify({ callId, callerId }),
    });
  }

  rejectCall(callId: string, callerId: string) {
    this.client.publish({
      destination: '/app/call/reject',
      body: JSON.stringify({ callId, callerId }),
    });
  }

  sendOffer(callId: string, toUserId: string, sdp: string) {
    this.client.publish({
      destination: '/app/call/offer',
      body: JSON.stringify({ callId, toUserId, sdp }),
    });
  }

  sendAnswer(callId: string, toUserId: string, sdp: string) {
    this.client.publish({
      destination: '/app/call/answer',
      body: JSON.stringify({ callId, toUserId, sdp }),
    });
  }

  sendIceCandidate(callId: string, toUserId: string, candidate: RTCIceCandidate) {
    this.client.publish({
      destination: '/app/call/ice',
      body: JSON.stringify({
        callId,
        toUserId,
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
      }),
    });
  }

  sendHangup(callId: string, toUserId: string) {
    this.client.publish({
      destination: '/app/call/hangup',
      body: JSON.stringify({ callId, toUserId }),
    });
  }

  closeModal() {
    this.callInvite.set(null);
  }
}
