import { Aggregate } from "../../lib/core/domain/aggregate"
import { Snapshot } from "../../lib/core/domain/history-snapshot"
import { EntityHook } from "../../lib/core/domain/hooks"
import { Id } from "../../lib/core/domain/ids"
import { ValueObject } from "../../lib/core/domain/value-object"
import { EntityProps } from "../../lib/core/interface/types"



describe('entity test', () => {

  interface UnitProps extends EntityProps {
    consumption: Consumption[]
    chargingModel: string
  }

  interface PropoalProps extends EntityProps {
    unit: Unit[]

  }
  class Address extends ValueObject<{
    street: string
    city: string
    state: string
    zip: string
  }> { }
  interface LeadProps extends EntityProps {
    proposals: Proposal[]
    proposal: Proposal | null
    address: Address
    rat: string 
  }

  class Consumption extends ValueObject<{
    value: number
  }> { }

  class Unit extends Aggregate<UnitProps> {
    protected static hooks = new EntityHook<Unit, UnitProps, UnitProps>({
   
    })

    public changeChargeModel(model: string) {
      this.props.chargingModel = model
    }

    get consumption() {
      return this.props.consumption
    }

    changeConsumption(consumption: Consumption[]) {
      this.props.consumption = consumption
    }
  }
  class Proposal extends Aggregate<PropoalProps> {
    protected static hooks = new EntityHook<Lead, LeadProps, LeadProps>({
  
    })

    get unit() {
      return this.props.unit
    }

    public addUnit(unit: Unit) {
      this.props.unit.push(unit)
    }

    public removeLastUnit() {
    }
    public getUnit(id: Id) {
      return this.props.unit.find(u => u.id.isEqual(id))
    }

  }
  class Lead extends Aggregate<LeadProps> {
    protected static hooks = new EntityHook<Lead, LeadProps, LeadProps>({
     
    })
    get address() {
      return this.props.address
    }
    get proposals() {
      return this.props.proposals
    }

    public changeCreatedAt(date: Date) {
      this.props.createdAt = date
    }

    public addProposal(proposal: Proposal) {
      this.props.proposals.push(proposal)
    }

    public getProposal(id: Id) {
      return this.props.proposals.find(p => p.id.isEqual(id))
    }

    get proposal() {
      return this.props.proposal
    }

    public changeAddress(address: Address) {  
      this.props.address = address
    }
  }

  it('create lead', () => {
    // console time the entire function with steps
     
    const unit1 = new Unit({ id: new Id('unit-1'), chargingModel: 'ax', consumption: [new Consumption({ value: 1 })] })
    const unit2 = new Unit({ id: new Id(), chargingModel: 'ax', consumption: [new Consumption({ value: 2 })] })
    const unit3 = new Unit({ id: new Id(), chargingModel: 'ax', consumption: [new Consumption({ value: 3 })] })
    const unit4 = new Unit({ id: new Id(), chargingModel: 'ax', consumption: [new Consumption({ value: 4 })] })
    const unit5 = new Unit({ id: new Id(), chargingModel: 'ax', consumption: [new Consumption({ value: 5 })] })
 

    const proposal1 = new Proposal({ id: new Id('proposal-1'), unit: [unit1, unit2] })
    const proposal2 = new Proposal({ id: new Id(), unit: [unit3, unit4] })
    const proposal3 = new Proposal({ id: new Id(), unit: [unit5] })

    const lead = new Lead({ id: new Id(), proposals: [proposal1, proposal2], proposal: proposal3, rat: '3232', 

      address: new Address({ city: 'city', state: 'state', street: 'street', zip: 'zip' })
     })
 

 
 

    const proposal = lead.getProposal(new Id('proposal-1'))
    if (!proposal) throw new Error('Proposal not found')
    const unit = proposal.getUnit(new Id('unit-1'))
    if (!unit) throw new Error('Unit not found')
/**
 *     unit.changeConsumption([new Consumption({ value: 7777, })])
    unit.changeConsumption([new Consumption({ value: 4232, })])
    unit.changeChargeModel('bx')

    proposal.addUnit(
      new Unit({ id: new Id(), chargingModel: 'cx', consumption: [new Consumption({ value: 7 })] })
    )

    proposal.removeLastUnit() 

    const unit222 = proposal.getUnit(unit2.id)
    unit222?.changeChargeModel('dx') */  

    function generatePrismaProps(snapshot: Snapshot<EntityProps>) {
      return snapshot
    }

    const result = lead.history.subs(lead, generatePrismaProps)  

    const groupedByAggregateName = result.reduce((acc, curr) => {
      if (!acc[curr.trace.instanceKey]) {
        acc[curr.trace.instanceKey] = {}
      }

      if (!acc[curr.trace.instanceKey][curr.trace.instanceId]) {
        acc[curr.trace.instanceKey][curr.trace.instanceId] = []
      }

      acc[curr.trace.instanceKey][curr.trace.instanceId].push(curr)
      return acc
    }, {} as Record<string, Snapshot<EntityProps>[]>)

   

    const resultData: string[] = []

    Object.entries(groupedByAggregateName).forEach(([_, s]) => {
      Object.entries(s ?? {}).forEach(([id, snapshots]) => {
        snapshots.forEach((snapshot: any) => {
          resultData.push(`UPDATE "${snapshot.trace.instanceKey}" SET ${snapshot.trace.fieldKey} = ${snapshot.trace.to} WHERE id = "${id}"`)
        })
      }) 
    }) 

    console.log(resultData) 


    lead.subscribe({
      
    })
    lead.proposals.forEach(proposal => {
      proposal.subscribe({
        unit: {
          onChange: ({ toUpdate }) => {
            console.log('unit changed toCreate', toUpdate[0].history.snapshots)
          }
        }
      })
    })
    console.log('◽◽◽◽◽◽◽◽◽◽')  
    lead.addProposal(new Proposal({ id: new Id(), unit: [new Unit({ id: new Id(), chargingModel: 'cx', consumption: [new Consumption({ value: 7 })] })] }))

    console.log('lead snap', lead.history.snapshots)
    console.log('proposal snap', lead.proposals.map(p => p.history.snapshots))
    lead.subscribe({
      
    })
     
  })

 

})