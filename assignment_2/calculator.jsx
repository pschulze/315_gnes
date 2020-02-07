function CalculatorButton(props) {
  return (
    <div className={`col-${props.btnSize || '3'} text-center p-1`}>
      <button className={`btn btn-${props.btnColor || 'light'} btn-block border border-dark`} onClick={props.onClick}>{props.btnVal}</button>
    </div>
  );
}

function CalculatorButtonLarge(props) {
  return (
    <div className="col-6 text-center p-1">
      <button className={`btn btn-${props.btnColor || 'light'} btn-block border border-dark`}>{props.btnVal}</button>
    </div>
  );
}

function CalculatorEntryField(props) {
  return (
    <div className="col text-right p-1">
      <input className="form-control" type="text" id="calculation-entry" disabled={true} value={props.currentEntry} />
    </div>
  );
}

function CalculatorIntermediateResult(props) {
  return (
    <div className="col text-right">
      <p>{props.lastAnswer}</p>
    </div>
  );
}

function ErrorAlert(props) {
  if (props.errorMessage) {
    return (
      <div className="alert alert-danger fade show my-1 " role="alert">
        {props.errorMessage}
      </div>
    );
  } else {
    return null;
  }
}

class Calculator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lastAnswer: null,
      currentEntry: ''
    }
  }

  appendEntry(value) {
    this.setState ({
      currentEntry: this.state.currentEntry.concat(value),
      lastAnswer:  this.state.lastAnswer
    });
  }

  evaluateEntry() {
    try {
      const result = String(eval(this.state.currentEntry));
      this.setState ({
        currentEntry: '',
        lastAnswer: result,
        errorMessage: null
      });
    } catch(err) {
      this.setState ({
        currentEntry: '',
        lastAnswer: this.state.lastAnswer,
        errorMessage: err.message
      });
    }
  }

  clearAll() {
    this.setState({
      currentEntry: '',
      lastAnswer: ''
    });
  }

  clearEntry() {
    this.setState({
      currentEntry: '',
      lastAnswer: this.state.lastAnswer
    });
  }

  render() {
    return (
      <div className="container-fluid">
        <ErrorAlert errorMessage={this.state.errorMessage} />
        <div className="row">
          <CalculatorEntryField currentEntry={this.state.currentEntry} />
        </div>
        <div className="row">
          <CalculatorIntermediateResult lastAnswer={this.state.lastAnswer} />
        </div>
        <div className="row">
          <CalculatorButton btnVal='(' onClick={() => this.appendEntry('(')} />
          <CalculatorButton btnVal=')' onClick={() => this.appendEntry(')')} />
          <CalculatorButton btnVal='C' btnColor='danger' onClick={() => this.clearAll()} />
          <CalculatorButton btnVal='CE' btnColor='warning' onClick={() => this.clearEntry()} />
        </div>
        <div className="row">
          <CalculatorButton btnVal='7' onClick={() => this.appendEntry('7')} />
          <CalculatorButton btnVal='8' onClick={() => this.appendEntry('8')} />
          <CalculatorButton btnVal='9' onClick={() => this.appendEntry('9')} />
          <CalculatorButton btnVal='/' btnColor='primary' onClick={() => this.appendEntry('/')} />
        </div>
        <div className="row">
          <CalculatorButton btnVal='4' onClick={() => this.appendEntry('4')} />
          <CalculatorButton btnVal='5' onClick={() => this.appendEntry('5')} />
          <CalculatorButton btnVal='6' onClick={() => this.appendEntry('6')} />
          <CalculatorButton btnVal='*' btnColor='primary' onClick={() => this.appendEntry('*')} />
        </div>
        <div className="row">
          <CalculatorButton btnVal='1' onClick={() => this.appendEntry('1')} />
          <CalculatorButton btnVal='2' onClick={() => this.appendEntry('2')} />
          <CalculatorButton btnVal='3' onClick={() => this.appendEntry('3')} />
          <CalculatorButton btnVal='-' btnColor='primary' onClick={() => this.appendEntry('-')} />
        </div>
        <div className="row">
          <CalculatorButton btnVal='0' onClick={() => this.appendEntry('0')} />
          <CalculatorButton btnVal='.' onClick={() => this.appendEntry('.')} />
          <CalculatorButton btnVal='=' onClick={() => this.evaluateEntry()} />
          <CalculatorButton btnVal='+' btnColor='primary' onClick={() => this.appendEntry('+')} />
        </div>
        <div className="row">
          <CalculatorButton btnVal='ANS' btnSize='6' onClick={() => this.appendEntry(this.state.lastAnswer)} />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Calculator />, document.getElementById('app'));
