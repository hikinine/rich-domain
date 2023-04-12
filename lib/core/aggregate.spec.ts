import { DomainEvent, EventHandler, HandlerPayload, IDomainEventPayload } from "../types"
import Aggregate from "./aggregate"

describe("", () => {

  it("", () => {

    type Props = { name: string, createdAt?: Date }

    class MyEvent implements DomainEvent<Teste> {
      public eventName: string
      constructor() {
        this.eventName = "TESTE_EVENT"
      }

      async dispatch(event: IDomainEventPayload<Teste>, handler: EventHandler<Teste, void>) {
        console.log("event dispatch", this.eventName)
        await handler.execute({ aggregate: event.aggregate, eventName: "TESTE_EVENT" })
      }
    }

    class Teste extends Aggregate<Props> {
      constructor(props: Props) {
        super(props)
        console.log("before event", (this as any).domainEvents)
        this.addEvent(new MyEvent())
      }
    }

    class RelatorioConcluidoEventHandler implements EventHandler<Teste> {

      execute(data: HandlerPayload<Teste>) {
        console.log("handler executado", data)

      }
    }
    const teste = new Teste({ name: "Paulo" })
    console.log("after event", (teste as any).domainEvents)
    teste.dispatchEvent("TESTE_EVENT", new RelatorioConcluidoEventHandler())
  })
})