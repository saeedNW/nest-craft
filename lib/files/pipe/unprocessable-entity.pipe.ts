import {
	ArgumentMetadata,
	BadRequestException,
	UnprocessableEntityException,
	ValidationPipe,
} from '@nestjs/common';

/**
 * Unprocessable entity pipe.
 * This pipe is used to transform the BadRequestException into an UnprocessableEntityException.
 */
export class UnprocessableEntityPipe extends ValidationPipe {
	/**
	 * Transform method to validate the input value.
	 * @param value - Input value to be validated
	 * @param metadata - Argument metadata
	 * @returns Promise<any>
	 */
	public async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
		try {
			// Calls the parent class's transform method to validate the input value
			return await super.transform(value, metadata);
		} catch (err) {
			if (err instanceof BadRequestException) {
				// Get the response from the error
				const exceptionResponse: string | object = err.getResponse();

				// Retrieve the exception's response message
				const message =
					typeof exceptionResponse === 'string'
						? exceptionResponse
						: (exceptionResponse as { message?: string }).message || '';

				// Throw an UnprocessableEntityException with the same message
				throw new UnprocessableEntityException(message);
			}
		}
	}
}
