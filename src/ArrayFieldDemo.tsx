import React, {useEffect, useState} from 'react';
import {ArrayField, TextArea, Form, Button, useFormState} from '@douyinfe/semi-ui';
import {IconPlusCircle, IconMinusCircle} from '@douyinfe/semi-icons';

function ArrayFieldDemo() {

    const [data, setData] = useState<{ name: string, role: string }[]>();
    useEffect(() => {
        setData([
            { name: 'Semi D2C', role: 'Engineer' },
            { name: 'Semi C2D', role: 'Designer' },
        ])
    }, []);

    return (
        <Form style={{width: 800}} labelPosition='left' labelWidth='100px' allowEmpty>
            <ArrayField field='rules' initValue={data}>
                {({add, arrayFields, addWithInitValue}) => (
                    <React.Fragment>
                        <Button onClick={add} icon={<IconPlusCircle/>} theme='light'>Add new line</Button>
                        <Button icon={<IconPlusCircle/>} onClick={() => {
                            addWithInitValue({name: 'Semi DSM', type: 'Designer'});
                        }} style={{marginLeft: 8}}>Add new line with init value</Button>
                        {
                            arrayFields.map(({field, key, remove}, i) => (
                                <div key={key} style={{width: 1000, display: 'flex'}}>
                                    <Form.Input
                                        field={`${field}[name]`}
                                        label={`${field}.name`}
                                        style={{width: 200, marginRight: 16}}
                                    >
                                    </Form.Input>
                                    <Form.Select
                                        field={`${field}[role]`}
                                        label={`${field}.role`}
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
        </Form>
    );
}

export default ArrayFieldDemo;