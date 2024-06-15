import { Aggregate } from "../../lib/core/domain/aggregate"
import { Snapshot } from "../../lib/core/domain/history-snapshot"
import { EntityHook } from "../../lib/core/domain/hooks"
import { Id } from "../../lib/core/domain/ids"
import { ValueObject } from "../../lib/core/domain/value-object"
import { EntityProps } from "../../lib/core/interface/types"



describe('entity test', () => {

  interface UnitProps extends EntityProps {
    consumption: Consumption[]
  }

  interface PropoalProps extends EntityProps {
    unit: Unit[]

  }
  interface LeadProps extends EntityProps {
    proposals: Proposal[]
    proposal: Proposal
  }

  class Consumption extends ValueObject<{
    value: number
  }> { }

  class Unit extends Aggregate<UnitProps> {
    protected static hooks = new EntityHook<Unit, UnitProps, UnitProps>({
      onChange: (_, snapshot) => {
        console.log('snapshot on Unit', snapshot)
      }
    })

    get consumption() {
      return this.props.consumption
    }

    changeConsumption(consumption: Consumption[]) {
      this.props.consumption = consumption
    }
  }
  class Proposal extends Aggregate<PropoalProps> {
    protected static hooks = new EntityHook<Lead, LeadProps, LeadProps>({
      onChange: (_, snapshot) => {

        console.log('snapshot on proposal', snapshot)
      }
    })

    get unit() {
      return this.props.unit
    }

    public getUnit(id: Id) {
      return this.props.unit.find(u => u.id.isEqual(id))
    }

  }
  class Lead extends Aggregate<LeadProps> {
    protected static hooks = new EntityHook<Lead, LeadProps, LeadProps>({
      onChange: (_, snapshot) => {
        console.log('snapshot on lead', snapshot)
      }
    })
    get proposals() {
      return this.props.proposals
    }

    public addProposal(proposal: Proposal) {
      this.props.proposals.push(proposal)
    }

    public getProposal(id: Id) {
      return this.props.proposals.find(p => p.id.isEqual(id))
    }
  }

  it('create lead', () => {

    const unit1 = new Unit({ id: new Id('unit-1'), consumption: [new Consumption({ value: 1 })] })
    const unit2 = new Unit({ id: new Id(), consumption: [new Consumption({ value: 2 })] })
    const unit3 = new Unit({ id: new Id(), consumption: [new Consumption({ value: 3 })] })
    const unit4 = new Unit({ id: new Id(), consumption: [new Consumption({ value: 4 })] })

    const proposal1 = new Proposal({ id: new Id('proposal-1'), unit: [unit1, unit2] })
    const proposal2 = new Proposal({ id: new Id(), unit: [unit3, unit4] })

    const lead = new Lead({ id: new Id(), proposals: [proposal1, proposal2], proposal: proposal1 })

    function onlyTrace(snapshot: Snapshot<any>) {
      return snapshot
    }

    console.log('lead history', lead.history.snapshots.map(onlyTrace))
    console.log('every proposal history', lead.proposals.map(p => p.history.snapshots.map(onlyTrace)).flat())
    console.log('every unit history', lead.proposals.map(p => p.unit.map(u => u.history.snapshots.map(onlyTrace)).flat()))

    console.log('🔶🔶🔶🔶🔶🔶🔶🔶🔶🔶🔶🔶🔶🔶')

    const proposal = lead.getProposal(new Id('proposal-1'))
    if (!proposal) throw new Error('Proposal not found')
    const unit = proposal.getUnit(new Id('unit-1'))
    if (!unit) throw new Error('Unit not found')
    unit.changeConsumption([new Consumption({ value: 1 })])
    console.log('🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷')
    const consumption = new Consumption({ value: 1 })
    const p = lead.proposals[0]
    const u = p.unit[0]
    u.consumption.push(consumption)

    console.log('🔷🔷🔷🔷🔷🔷🔶🔶🔶🔶🔶🔶🔶🔶🔶🔶')

    lead.addProposal(
      new Proposal({ id: new Id(), unit: [new Unit({ id: new Id(), consumption: [new Consumption(13)] })] })
    )


    console.log('💢💢💢💢💢💢💢💢💢')
    console.log('lead history', lead.history.snapshots.flatMap(onlyTrace))
    console.log('every proposal history', lead.proposals.flatMap(p => p.history.snapshots.flatMap(onlyTrace)).flat())
    console.log('every unit history', lead.proposals.flatMap(p => p.unit.flatMap(u => u.history.snapshots.map(onlyTrace))))

    lead.subscribe({
      self: (a) => {
          
        },
      proposals: {
        self: (a) => {

        }
      },
      proposal: {
        self: (a) => {

        },
        unit: {
          self: (a) => {

          },
          consumption: {
            self: (a) => {

            }
          }
        }
      }
    })
  })


})