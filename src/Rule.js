import PropTypes from 'prop-types';
import React from 'react';
import TreeHelper from './helpers/TreeHelper';

const defaultErrorMsg = 'Input value is not correct';

const isValueCorrect = (pattern, value) => {
  const newPattern = new RegExp(pattern);
  const match = newPattern.exec(value);
  return match === null;
};

class Rule extends React.Component {

  static setNativeValue(element, value) {
    const { set: valueSetter } = Object.getOwnPropertyDescriptor(element, 'value') || {};
    const prototype = Object.getPrototypeOf(element);
    const { set: prototypeValueSetter } = Object.getOwnPropertyDescriptor(prototype, 'value') || {};

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    }
  }

  constructor(props) {
    super(props);
    this.getFieldByName = this.getFieldByName.bind(this);
    this.generateRuleObject = this.generateRuleObject.bind(this);
    this.onFieldChanged = this.onFieldChanged.bind(this);
    this.onFieldValueChanged = this.onFieldValueChanged.bind(this);
    this.onOperatorChanged = this.onOperatorChanged.bind(this);
    this.onOperatorValueChange = this.onOperatorValueChange.bind(this);
    this.onInputChanged = this.onInputChanged.bind(this);
    this.onInputValueChange = this.onInputValueChange.bind(this);
    this.getInputTag = this.getInputTag.bind(this);
    this.changeOperatorValue = this.changeOperatorValue.bind(this);
    this.updateInput = this.updateInput.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.treeHelper = new TreeHelper(this.props.data);
    this.styles = this.props.styles;
    this.node = this.treeHelper.getNodeByName(this.props.nodeName);

    if (this.node) {
      const field = this.getFieldByName(this.node.field);
      this.state = {
        currField: this.generateRuleObject(field, this.node),
        validationError: false,
      };
    }
  }

  componentWillReceiveProps(nextProps) {
    this.node = this.treeHelper.getNodeByName(nextProps.nodeName);
  }


  onFieldChanged(event) {
    const value = event.target.value;
    this.onFieldValueChanged(value);
  }


  onFieldValueChanged(value) {
    this.node.field = value;
    this.node.value = '';
    if (this.inputRef) {
      Rule.setNativeValue(this.inputRef, '');
    }
    this.onInputValueChange('');
  }

  onOperatorChanged(event) {
    const value = event.target.value;
    this.onOperatorValueChange(value);
    this.changeOperatorValue(event.target.value);
  }

  onOperatorValueChange(value) {
    this.node.operator = value;
    const field = this.getFieldByName(this.node.field);
    const rule = this.generateRuleObject(field, this.node);
    this.setState({ currField: rule });
    this.props.onChange();
  }

  onInputChanged(event) {
    const value = event.target.value;
    this.onInputValueChange(value);
    this.updateInput(event.target.value);
  }

  onInputValueChange(value) {
    const pattern = this.state.currField.input.pattern;
    let validationError = false;
    if (pattern) {
      validationError = isValueCorrect(pattern, value);
    }
    this.node.value = value;
    const field = this.getFieldByName(this.node.field);
    const rule = this.generateRuleObject(field, this.node);
    this.setState({
      currField: rule,
      validationError,
    });
    this.props.onChange();
  }

  updateInput(value) {
    const pattern = this.state.currField.input.pattern;
    if (pattern) {
      this.setState({ validationError: isValueCorrect(pattern, value) });
    }
    this.node.value = value;
    const field = this.getFieldByName(this.node.field);
    const rule = this.generateRuleObject(field, this.node);
    this.setState({ currField: rule });
    this.props.onChange();
  }


  getFieldByName(name) {
    return this.props.fields.find(x => x.name === name);
  }

  getInputTag(inputType) {
    const errorText = this.state.currField.input.errorText;

    switch (inputType) {
      case 'textarea':
        return (
          <div className={this.styles.txtArea}>
            <textarea
              className="input"
              onChange={this.onInputChanged}
              ref={(instance) => {
                this.inputRef = instance;
              }}
              value={this.node.value ? this.node.value : ''}
            />
            {
              this.state.validationError
                ? <p className={this.styles.error}>{errorText || defaultErrorMsg}</p>
                : null
            }
          </div>);
      case 'select':
        return (
          <div>
            <select
              value={this.node.value}
              className={this.styles.select}
              onChange={this.onInputChanged}
              ref={(instance) => {
                this.inputRef = instance;
              }}
            >
              {this.state.currField.input.options.map((option, index) =>
                <option value={option.value} key={index}>{option.name}</option>)}
            </select>
            {
              this.state.validationError
                ? <p className={this.styles.error}>{errorText || defaultErrorMsg}</p>
                : null
            }
          </div>);
      case 'date': return this.props.datepickerRenderer
        ? this.renderCustomDatepicker()
          : (
            <div>
              <input
                type={this.state.currField.input.type}
                value={this.node.value}
                onChange={this.onInputChanged} className={this.styles.input}
              />
              {
                this.state.validationError
                ? <p className={this.styles.error}>{errorText || defaultErrorMsg}</p>
                : null
              }
            </div>
          );
      default:
        return (
          <div>
            <input
              type={this.state.currField.input.type}
              value={this.node.value}
              onInput={this.onInputChanged}
              className={this.styles.input}
              ref={(instance) => {
                this.inputRef = instance;
              }}
            />
            {
              this.state.validationError
                ? <p className={this.styles.error}>{errorText || defaultErrorMsg}</p>
                : null
            }
          </div>);
    }
  }

  changeOperatorValue(value) {
    this.node.operator = value;
    const field = this.getFieldByName(this.node.field);
    const rule = this.generateRuleObject(field, this.node);
    this.setState({ currField: rule });
    this.props.onChange();
  }

  generateRuleObject(field, node) {
    const rule = {};
    rule.input = field.input;
    const newNode = node || this.treeHelper.getNodeByName(this.props.nodeName);
    rule.input.value = newNode.value;
    if (!field.operators || typeof (field.operators) === 'string') {
      rule.operators = this.props.operators;
      return rule;
    }
    const ruleOperators = [];
    for (let i = 0, length = field.operators.length; i < length; i += 1) {
      for (let opIndex = 0, opLength = this.props.operators.length; opIndex < opLength;
           opIndex += 1) {
        if (field.operators[i] === this.props.operators[opIndex].operator) {
          ruleOperators.push(this.props.operators[opIndex]);
        }
      }
    }
    rule.operators = ruleOperators;
    return rule;
  }

  handleDelete() {
    this.treeHelper.removeNodeByName(this.props.nodeName);
    this.props.onChange();
  }

  renderCustomDatepicker() {
    const { datepickerRenderer } = this.props;

    return datepickerRenderer({
      value: this.node.value,
      onChange: this.updateInput,
    });
  }

  renderDefaultFieldsSelect() {
    return (
      <select
        value={this.node.field}
        className={this.styles.select}
        onChange={this.onFieldChanged}
      >
        {this.props.fields.map((field, index) =>
          <option value={field.name} key={index}>{field.label}</option>
        )}
      </select>
    );
  }

  renderDefaultOperatorsSelect() {
    return (
      <select
        value={this.node.operator}
        className={this.styles.select}
        onChange={this.onOperatorChanged}
      >
        {this.state.currField.operators.map((operator, index) =>
          <option value={operator.operator} key={index}>{operator.label}</option>
        )}
      </select>
    );
  }

  renderCustomFieldsSelect() {
    const { selectRenderer } = this.props;
    return selectRenderer({
      options: this.props.fields.map(({ name, label }) => ({
        value: name,
        label,
      })),
      value: this.node.field,
      onChange: this.onFieldValueChanged,
    });
  }

  renderCustomOperatorsSelect() {
    const { selectRenderer } = this.props;

    return selectRenderer({
      options: this.state.currField.operators
        .map(({ operator, label }) => ({
          value: operator,
          label,
        })),
      value: this.node.operator,
      onChange: this.changeOperatorValue,
    });
  }

  render() {
    const { selectRenderer } = this.props;
    return (
      <div className={this.styles.rule}>
        {typeof this.props.fieldRenderer === 'function' ? this.props.fieldRenderer(this.onFieldValueChanged, this.node.field, `${this.props.nodeName}.field`) :
          (selectRenderer
            ? this.renderCustomFieldsSelect()
            : this.renderDefaultFieldsSelect())}
        {typeof this.props.operatorRenderer === 'function' ? this.props.operatorRenderer(this.onOperatorValueChange, this.node.operator, `${this.props.nodeName}.operator`, this.state.currField.operators) :
          (selectRenderer
            ? this.renderCustomOperatorsSelect()
            : this.renderDefaultOperatorsSelect()
          )
        }
        {typeof this.state.currField.input.renderer === 'function' ?
          this.state.currField.input.renderer(this.onInputValueChange, (instance) => {
            this.inputRef = instance;
          }, this.node.value, `${this.props.nodeName}.input`, this.state.validationError) : this.getInputTag(this.state.currField.input.type)}
        {typeof this.props.deleteButtonRenderer === 'function' ? this.props.deleteButtonRenderer(this.handleDelete, this.props.buttonsText.delete) :
        <button
          type="button"
          className={this.styles.deleteBtn}
          onClick={this.handleDelete}
        >{this.props.buttonsText.delete}</button>
        }
      </div>
    );
  }
}

Rule.propTypes = {
  buttonsText: PropTypes.object,
  data: PropTypes.object.isRequired,
  fields: PropTypes.array.isRequired,
  nodeName: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  operators: PropTypes.array.isRequired,
  styles: PropTypes.object.isRequired,
  fieldRenderer: PropTypes.func,
  operatorRenderer: PropTypes.func,
  deleteButtonRenderer: PropTypes.func,
  selectRenderer: PropTypes.func,
  datepickerRenderer: PropTypes.func,
};

export default Rule;
