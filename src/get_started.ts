import * as webllm from "@mlc-ai/web-llm";

const STREAM = true

function setLabel(id: string, text: string) {
  const label = document.getElementById(id)
  if (label == null) {
    throw Error("Cannot find label " + id)
  }
  label.innerText = text
}

function delay(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration))
}

async function main() {
  const initProgressCallback = (report: webllm.InitProgressReport) => {
    setLabel("init-label", report.text)
  }
  const selectedModel = "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC-1k"
  const engine: webllm.MLCEngineInterface = await webllm.CreateMLCEngine(
    selectedModel,
    { initProgressCallback: initProgressCallback },
  )

  async function generateStory(stream: boolean) {
    const reply = await engine.chat.completions.create({
      messages: [{ role: "user", content: "Tell me a paragraph-long story." }],
      stream
    })
    if (stream) {
      let message = "";
      for await (const chunk of reply) {
        if (chunk.choices[0].delta.content) {
          message += chunk.choices[0].delta.content;
        }
      }
      console.log('Generated >>> ', message)
    } else {
      console.log('Generated >>> ', reply.choices[0].message.content)
    }
  }

  const storyPromise = Promise.resolve()
    .then(() => generateStory(STREAM))
    .then(() => delay(500))
    .then(() => generateStory(STREAM))

  const interruptPromise = Promise.resolve()
    .then(() => delay(500))
    .then(() => {
      console.log('Interrupting...')
      engine.interruptGenerate()
    })

  await Promise.all([storyPromise, interruptPromise])
}

main()
