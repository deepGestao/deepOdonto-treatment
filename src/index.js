import { DynamoDB } from 'aws-sdk';
import uuid4 from 'uuid4';
import { parseRequest } from './parseRequest/parseRequest';

const dynamodb = new DynamoDB();

const save = async (content) => {
  const contentCopy = content;
  contentCopy.data.treatId = uuid4();
  await dynamodb.putItem({
    TableName: `deepOdonto-treatment-${process.env.AWS_ENV}`,
    Item: DynamoDB.Converter.marshall({ ...content.data, createdAt: new Date().toISOString }),
  }).promise();
  return content.data.treatId;
};

const parseContent = (content) => {
  if (content === null) {
    return {};
  }
  return JSON.parse(content);
};

const sendAction = async (content) => {
  const dict = {
    POST: save,
  };
  const result = await dict[`${content.action}`](content);
  return result;
};

const handler = async (event, context) => {
  console.log(event, context);
  const content = parseContent(event.body);
  content.data.id = uuid4();
  content.action = event.httpMethod;
  const validate = parseRequest(content);
  try {
    if (validate) {
      await sendAction(content);
      return {
        statusCode: 200,
        body: '{}',
      };
    }
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Bad Request' }),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'internal server error' }),
    };
  }
};

export { handler };
