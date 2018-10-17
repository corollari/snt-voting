import {Link} from "react-router-dom";
import Button from '@material-ui/core/Button';
import React, {Component, Fragment} from 'react';
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles';
import Slider from '@material-ui/lab/Slider';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { withRouter } from 'react-router-dom'

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  thumb: {
    width: '24px',
    height: '24px'
  },
  appBar: {
    position: 'relative',
  },
  flex: {
    flex: 1,
  },
};
class PollVoting extends Component {

  state = {
    votes: [],
    originalVotes: []
  }

  componentDidMount(){
    const {polls} = this.props;

    if(!polls || !polls.length){
      this.props.history.push('/');
      console.log("A");
    }

    const poll = polls[0];

    const votes = [];
    for(let i = 0; i < poll._numBallots; i++){
      votes[i] = 0; // props.votes[i];
    }

    this.setState({
      originalVotes: votes.slice(0),
      votes
    });
  }

  updateVotes = i => numVotes => {
    const votes = this.state.votes;
    votes[i] = numVotes;
    this.setState({votes});
  }

  sendToReview = () => {
    this.props.setVotesToReview(this.state.votes);
    this.props.history.push('/review');
  }

  render(){
    const {polls, classes, balances} = this.props;
    const {originalVotes, votes} = this.state;
    const {fromWei} = web3.utils;

    if(!polls || !polls.length){
      return null;
    }

    const symbol = "SNT"; // TODO:

    const poll = polls[0];

    const title = poll.content.title;
    const ballots = poll.content.ballots
    
    const balance = fromWei(balances[0].tokenBalance, "ether");
    const cantVote = balance == 0 || !poll._canVote;
    const disableVote = cantVote;

    const availableCredits = parseInt(balance, 10) - votes.reduce((prev, curr) => prev + curr * curr, 0);

    // Votes calculation
    const originalVotesQty = originalVotes.reduce((x,y) => x+y, 0);
    const buttonText = originalVotesQty != 0 && !arraysEqual(originalVotes, votes) ? 'Change Vote' : 'Vote';

    // Calculating votes availables
    const maxVotes = Math.floor(Math.sqrt(balance));

    const maxValuesForBallots = [];
    let votedSNT = 0;
    for(let i = 0; i < poll._numBallots; i++){
      if(votes[i] == undefined){
        votes[i] = 0;
      } else {
        votedSNT += votes[i]*votes[i];
      }
    }

    for(let i = 0; i < poll._numBallots; i++){
      maxValuesForBallots[i]  = Math.floor(Math.sqrt(balance - votedSNT + votes[i]*votes[i]));
    }

    return <div className="section">
        <Typography variant="headline">{title}</Typography>
      { ballots.map((item, i) => {
          return <BallotSlider key={i} title={item.title} subtitle={item.subtitle} symbol={symbol} classes={classes} votes={votes[i]} cantVote={cantVote} balance={balance} maxVotes={maxVotes} maxVotesAvailable={maxValuesForBallots[i]} updateVotes={this.updateVotes(i)} />

      })}
      <Typography>{availableCredits} Credits left</Typography>
      <Button disabled={disableVote} variant="text" onClick={this.sendToReview}>Review vote</Button>
    </div>
  }
}


class BallotSlider extends Component {

  constructor(props){
    super(props);
    this.state = {
      value: props.votes || 0
    }
  }

  handleChange = (event, value) => {
    if(value > this.props.maxVotesAvailable){
      value = this.props.maxVotesAvailable;
    }
    this.setState({value});
    this.props.updateVotes(value);
  };

  render(){
    const {maxVotes, maxVotesAvailable, classes, cantVote, balance, symbol, title, subtitle} = this.props;
    const {value} = this.state;
    const nextVote = value + 1;

    return <Card className="card">
              <CardContent>
                <Typography gutterBottom component="h2">{title}</Typography>
                <Typography component="p">{subtitle}</Typography>
                <Slider disabled={cantVote} classes={{ thumb: classes.thumb }} style={{ width: '95%' }} value={value} min={0} max={maxVotes} step={1}  onChange={this.handleChange} />
                {balance > 0 && !cantVote && <b>Your votes: {value} ({value * value} {symbol})</b>}
                { nextVote <= maxVotesAvailable && !cantVote ? <small>- Additional vote will cost {nextVote*nextVote - value*value} {symbol}</small> : (balance > 0 && !cantVote && <small>- Not enough balance available to buy additional votes</small>) }
              </CardContent>
          </Card>
  }
}


export default withRouter(withStyles(styles)(PollVoting));
