import { Injectable } from '@angular/core';

export interface AudioLoopOptions {
  volume?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AudioService {

  private readonly audioMap = new Map<string, HTMLAudioElement>();

  playLoop(key: string, src: string, options?: AudioLoopOptions): void {
    let audio = this.audioMap.get(key);

    if (!audio) {
      audio = new Audio(src);
      audio.loop = true;
      this.audioMap.set(key, audio);
    }

    if (options?.volume !== undefined) {
      audio.volume = options.volume;
    }

    audio.currentTime = 0;

    audio
      .play()
      .catch((err) => {
        console.warn('[AudioService] Failed to play loop', key, err);
      });
  }

  stop(key: string): void {
    const audio = this.audioMap.get(key);
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
  }

  stopAll(): void {
    for (const audio of this.audioMap.values()) {
      audio.pause();
      audio.currentTime = 0;
    }
  }
}
