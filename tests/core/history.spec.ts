import { Aggregate } from "../../lib/core/domain/aggregate"
import { EntityHook } from "../../lib/core/domain/hooks"
import { Id } from "../../lib/core/domain/ids"
import { EntityProps } from "../../lib/core/interface/types"

 


describe('entity test', () => {

  interface UnitProps extends EntityProps {
    name: string
  }

  interface PropoalProps extends EntityProps {
    title: string
    unit: Unit 
    description: string
    deadline: Date
 
  }
  interface LeadProps extends EntityProps {
    proposals: Proposal[]
    unit: Unit  | null
    a: string[]
  }

  class Unit extends Aggregate<UnitProps> {
 
    changeName(name: string) {
      this.props.name = name
    }
    get name() {
      return this.props.name
    }
  }
  class Proposal extends Aggregate<PropoalProps> {
    protected static hooks = new EntityHook<Lead, LeadProps, LeadProps>({
      onChange: (_, snapshot) => {
        console.log('snapshot on proposal', snapshot.trace)
      }
    })
    public desactive() {
      this.props.deadline = new Date(Date.now() - 1000)
    }

    get title() {
      return this.props.title
    }

    get description() {
      return this.props.description
    }

    get deadline() {
      return this.props.deadline
    }
    get unit() {
      return this.props.unit
    }
  }
  class Lead extends Aggregate<LeadProps> {
    protected static hooks = new EntityHook<Lead, LeadProps, LeadProps>({
      onChange: (_, snapshot) => {
        console.log('snapshot on lead', snapshot.trace) 
      }
    })
    public addProposal(proposal: Proposal) {
      this.props.proposals.push(proposal)
    }

    public removeProposal(proposal: Proposal) {
      this.props.proposals = this.props.proposals.filter(p => p.isEqual(proposal))
    }

    get proposals() {
      return this.props.proposals
    }
  }


  it('should create a new entity', () => {
    const lead = new Lead({
      id: new Id(),
      proposals: [],
      unit: new Unit({
        id: new Id(),
        name: 'unit name'
      }),
      a: []
    })

    const proposal = new Proposal({
      id: new Id(),
      unit: new Unit({
        id: new Id(),
        name: 'unit name',
      }), 
      deadline: new Date(Date.now() + 99999),
      description: 'proposal description',
      title: 'proposal title',
      createdAt: new Date()
    })

    lead.addProposal(proposal)
    lead.history.hasChange('')
    proposal.desactive()
    proposal.unit.changeName('new unit name')
 

    console.log('lead', lead.history.onChange)
    console.log('proposal', proposal.history.onChange )
    console.log('unit', proposal.unit.history.onChange )
    expect(lead.proposals.length).toBe(1)

  })

})