import React, {useEffect, useState} from 'react';
import {ArrayField, TextArea, Form, Button, useFormState, Row} from '@douyinfe/semi-ui';
import {IconPlusCircle, IconMinusCircle} from '@douyinfe/semi-icons';

function ArrayFieldForm() {

    const [data, setData] = useState<{ name: string, defaultValue: string }[]>();
    useEffect(() => {
        setData([
            {name: 'Semi D2C', defaultValue: 'Engineer'},
            {name: 'Semi C2D', defaultValue: 'Designer'},
        ])
    }, []);

    return (
        <Form style={{width: 500}} labelPosition='left' labelWidth='100px' allowEmpty>
            <ArrayField field='field' initValue={data}>
                {({add, arrayFields, addWithInitValue}) => (
                    <React.Fragment>
                        <Button onClick={add} icon={<IconPlusCircle/>} theme='light'>添加字段</Button>
                        {
                            arrayFields.map(({field, key, remove}, i) => (
                                <div key={key} style={{width: 600, display: 'flex'}}>
                                    <Form.Select
                                        field={`${field}[name]`}
                                        label={`字段名`}
                                        style={{width: 120, marginRight: 20}}
                                        optionList={[
                                            {label: 'Engineer', value: 'Engineer'},
                                            {label: 'Designer', value: 'Designer'},
                                        ]}
                                    >
                                    </Form.Select>
                                    <Form.Select
                                        field={`${field}[defaultValue]`}
                                        label={`默认值`}
                                        style={{width: 120}}
                                        optionList={[
                                            {label: 'Engineer', value: 'Engineer'},
                                            {label: 'Designer', value: 'Designer'},
                                        ]}
                                    >
                                    </Form.Select>
                                    <Button
                                        type='danger'
                                        theme='borderless'
                                        icon={<IconMinusCircle/>}
                                        onClick={remove}
                                        style={{margin: 12}}
                                    />
                                </div>
                            ))
                        }
                    </React.Fragment>
                )}
            </ArrayField>
                <Row>
                    <Button type="primary" htmlType="submit" className="btn-margin-right">
                        Submit
                    </Button>
                    <Button htmlType="reset">reset</Button>
                </Row>
        </Form>
    );
}

export default ArrayFieldForm;