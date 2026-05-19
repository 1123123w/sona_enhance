export interface TaskSignal {
  readonly cancelled: boolean
}

export class DelayTask {
  private timer: ReturnType<typeof setTimeout> | null = null
  private generation = 0

  get active() {
    return this.timer !== null
  }

  cancel() {
    this.generation++
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  schedule(delayMs: number, task: (signal: TaskSignal) => void | Promise<void>): TaskSignal {
    this.cancel()
    const generation = this.generation
    const owner = this
    const signal: TaskSignal = {
      get cancelled() {
        return generation !== owner.generation
      },
    }

    const run = () => {
      if (generation !== this.generation) return
      this.timer = null
      void task(signal)
    }

    if (delayMs <= 0) {
      run()
      return signal
    }

    this.timer = setTimeout(run, delayMs)
    return signal
  }
}
